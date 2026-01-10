import os
import sys
import time
import datetime
import requests
import frontmatter
from github import Github

# Configuration
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
REPO_NAME = os.environ.get('GITHUB_REPOSITORY') # e.g. "owner/repo"
CHECK_LIMIT = 50
TIMEOUT_SECONDS = 10

def get_now_str():
    return datetime.datetime.now().strftime('%Y-%m-%d %H:%M')

def check_url(url):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; HubNavigatorBot/1.0; +https://github.com/LiuJi/HubNavigator)'
        }
        response = requests.get(url, headers=headers, timeout=TIMEOUT_SECONDS, allow_redirects=True)
        return response.status_code >= 200 and response.status_code < 400
    except Exception as e:
        print(f"Error checking {url}: {e}")
        return False

def sync_labels(issue, status):
    desired_label = f"status:{status}"
    try:
        current_labels = [l.name for l in issue.get_labels()]
        status_labels = ["status:active", "status:warning", "status:broken", "triage"]
        
        if desired_label not in current_labels:
            issue.add_to_labels(desired_label)
            print(f"    -> Added label: {desired_label}")
            
        for label in current_labels:
            if label in status_labels and label != desired_label:
                issue.remove_from_labels(label)
                print(f"    -> Removed label: {label}")
    except Exception as e:
        print(f"    -> Failed to sync labels: {e}")

def main():
    if not GITHUB_TOKEN or not REPO_NAME:
        print("Error: GITHUB_TOKEN and GITHUB_REPOSITORY env vars required.")
        # For local dev without token, maybe just exit or warn
        if not GITHUB_TOKEN:
             print("Skipping execution (No Token).")
             sys.exit(0)

    g = Github(GITHUB_TOKEN)
    repo = g.get_repo(REPO_NAME)
    
    # 1. Fetch Issues
    # We want issues with label 'kind:site'
    # Note: searching issues might be better if we have many
    print("Fetching issues...")
    issues = repo.get_issues(state='open', labels=['kind:site'])
    
    targets = []
    
    for issue in issues:
        # Parse Front Matter from Body
        try:
            post = frontmatter.loads(issue.body)
            if not post.metadata:
                continue
                
            # Check labels/status priority
            status = post.metadata.get('status', 'active')
            last_check = post.metadata.get('last_check', '2000-01-01')
            
            # Simple priority score: 
            # Warning = 100
            # Active = 0 - timestamp (older is smaller/better? No, we want Older to be processed first)
            # Actually, let's just create two lists
            
            targets.append({
                'issue': issue,
                'post': post,
                'status': status,
                'last_check': last_check
            })
        except Exception as e:
            print(f"Failed to parse issue #{issue.number}: {e}")

    # 2. Sort Logic (LRU + Priority)
    # Filter 1: Status == warning (High Priority)
    warning_queue = [t for t in targets if t['status'] == 'warning']
    
    # Filter 2: Active items, sorted by last_check ASC (Oldest first)
    active_queue = [t for t in targets if t['status'] == 'active']
    active_queue.sort(key=lambda x: x['last_check'])
    
    # Combine
    final_queue = warning_queue + active_queue
    
    # Limit
    to_process = final_queue[:CHECK_LIMIT]
    print(f"Processing {len(to_process)} sites (Total candidates: {len(targets)})")
    
    # 3. Execution
    for item in to_process:
        issue = item['issue']
        post = item['post']
        url = post.metadata.get('url')
        current_fail = post.metadata.get('fail_count', 0)
        
        if not url:
            continue
            
        print(f"Checking [{issue.number}] {post.metadata.get('name')} - {url} ...")
        
        is_alive = check_url(url)
        now_str = get_now_str()
        
        # Update Metadata
        post.metadata['last_check'] = now_str
        
        if is_alive:
            print(f"  -> Alive")
            post.metadata['fail_count'] = 0
            if post.metadata.get('status') == 'warning':
                post.metadata['status'] = 'active'
                # Remove warning label if exists? 
                # Ideally script syncs labels too, but let's keep it simple for now (metadata is source of truth)
        else:
            print(f"  -> Dead")
            post.metadata['fail_count'] = current_fail + 1
            if post.metadata['fail_count'] >= 3:
                post.metadata['status'] = 'broken'
                print("  -> Status changed to BROKEN")
                # Optionally add comment
                # issue.create_comment(f"⚠️ Site unreachable (Attempt {post.metadata['fail_count']}). Marked as broken.")
            elif post.metadata['status'] == 'active':
                 post.metadata['status'] = 'warning'
                 print("  -> Status changed to WARNING")

        # Sync Labels
        sync_labels(issue, post.metadata['status'])

        # 4. Write Back
        # Construct new body
        new_body = frontmatter.dumps(post)
        
        # Only update if changed (frontmatter.dumps might change formatting slightly, so usually yes)
        if new_body.strip() != issue.body.strip():
            try:
                issue.edit(body=new_body)
                print("  -> Issue updated.")
                # Rate limit sleep slightly
                time.sleep(1) 
            except Exception as e:
                print(f"  -> Failed to update issue: {e}")

if __name__ == "__main__":
    main()

import os
import sys
import datetime
from github import Github
import frontmatter

# Config
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
REPO_NAME = os.environ.get('GITHUB_REPOSITORY')
ISSUE_NUMBER = os.environ.get('ISSUE_NUMBER')
COMMENT_BODY = os.environ.get('COMMENT_BODY', '').strip()
COMMENT_AUTHOR = os.environ.get('COMMENT_AUTHOR', '')

def main():
    if not GITHUB_TOKEN or not REPO_NAME or not ISSUE_NUMBER:
        print("Missing environment variables.")
        sys.exit(1)

    g = Github(GITHUB_TOKEN)
    repo = g.get_repo(REPO_NAME)
    issue = repo.get_issue(int(ISSUE_NUMBER))

    # Parse Command
    if not COMMENT_BODY.startswith('/'):
        print("Not a command.")
        return

    # Security Check: Only Owner or specific users can execute Ops
    # For MVP, we assume Repo Owner = Admin. 
    owner_login = REPO_NAME.split('/')[0]
    
    # Optional: Allow hardcoded list
    ADMINS = [owner_login]
    
    if COMMENT_AUTHOR not in ADMINS:
        print(f"Skipping: User '{COMMENT_AUTHOR}' is not authorized.")
        return

    if COMMENT_BODY.startswith('/approve'):
        handle_approve(issue)
    elif COMMENT_BODY.startswith('/update'):
        handle_update(issue)
    elif COMMENT_BODY.startswith('/category'):
        handle_category(issue, COMMENT_BODY)
    else:
        print(f"Unknown command: {COMMENT_BODY}")

def handle_approve(issue):
    print(f"Approving issue #{issue.number}...")
    try:
        post = frontmatter.loads(issue.body)
        post.metadata['status'] = 'active'
        post.metadata['fail_count'] = 0
        
        issue.edit(body=frontmatter.dumps(post))
        
        # Labels
        labels = [l.name for l in issue.labels]
        if 'triage' in labels:
            issue.remove_from_labels('triage')
        issue.add_to_labels('status:active')
        
        issue.create_comment("✅ **Site Approved!** \nThe site is now Active.")
    except Exception as e:
        issue.create_comment(f"❌ Error approving site: {e}")

def handle_update(issue):
    try:
        post = frontmatter.loads(issue.body)
        post.metadata['last_check'] = '2000-01-01 00:00'
        issue.edit(body=frontmatter.dumps(post))
        issue.create_comment("🔄 **Update Triggered.**")
        # Add a one-time label to trigger automation immediately?
        # For now, just rely on Cron picking it up because last_check is old
    except Exception as e:
        print(f"Error updating: {e}")

def handle_category(issue, command):
    # /category Add ai-chat
    parts = command.split()
    if len(parts) < 3:
        return
        
    action = parts[1].lower()
    cat = parts[2]
    
    try:
        post = frontmatter.loads(issue.body)
        current_cats = post.metadata.get('categories', [])
        if isinstance(current_cats, str):
            current_cats = [current_cats]
            
        if action == 'add':
            if cat not in current_cats:
                current_cats.append(cat)
                issue.create_comment(f"🏷️ Added category: `{cat}`")
        elif action == 'del':
            if cat in current_cats:
                current_cats.remove(cat)
                issue.create_comment(f"🗑️ Removed category: `{cat}`")
                
        post.metadata['categories'] = current_cats
        issue.edit(body=frontmatter.dumps(post))
    except Exception as e:
         print(f"Error changing category: {e}")

if __name__ == "__main__":
    main()

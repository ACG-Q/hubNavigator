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
    # 逻辑：我们将仓库地址（如 ACG-Q/hubNavigator）的第一部分提取出来作为 Owner
    owner_login = REPO_NAME.split('/')[0]
    
    # 管理员列表（目前只包含仓库所有者）
    ADMINS = [owner_login]
    
    # 判断发表评论的人 (COMMENT_AUTHOR) 是否在管理员列表中
    if COMMENT_AUTHOR not in ADMINS:
        print(f"Skipping: User '{COMMENT_AUTHOR}' is not authorized.")
        return

    if COMMENT_BODY.startswith('/approve'):
        handle_approve(issue)
    elif COMMENT_BODY.startswith('/update'):
        handle_update(issue)
    elif COMMENT_BODY.startswith('/category'):
        handle_category(issue, COMMENT_BODY)
    elif COMMENT_BODY.startswith('/merge'):
        handle_merge(repo, issue)
    elif COMMENT_BODY.startswith('/label'):
        handle_label(issue, COMMENT_BODY)
    else:
        print(f"Unknown command: {COMMENT_BODY}")

def handle_merge(repo, issue):
    """
    Applies changes from a correction/migration issue to the target site issue.
    """
    print(f"Merging changes from issue #{issue.number}...")
    try:
        source_post = frontmatter.loads(issue.body)
        meta = source_post.metadata
        
        type_ = meta.get('type')
        if type_ not in ['correction', 'migration']:
            issue.create_comment("❌ This issue is not a correction or migration. Only these types can be merged.")
            return

        target_id = meta.get('target_id')
        if not target_id:
            issue.create_comment("❌ Cannot find `target_id` in metadata. Please ensure the site name/ID is correct.")
            return

        print(f"Target site ID identified: {target_id}")
        try:
            target_issue = repo.get_issue(int(target_id))
        except Exception:
            issue.create_comment(f"❌ Could not find target issue #{target_id}. Please check the ID.")
            return

        target_post = frontmatter.loads(target_issue.body)
        
        if type_ == 'correction':
            # Apply Name, URL, Categories
            if meta.get('name'): target_post.metadata['name'] = meta['name']
            if meta.get('url'): target_post.metadata['url'] = meta['url']
            if meta.get('categories'): target_post.metadata['categories'] = meta['categories']
            
            # If there's a description in the request, we could append or replace. 
            # For now, let's just update metadata.
            
            summary = f"Applied correction from #{issue.number}."
        
        elif type_ == 'migration':
            # Apply Link Change
            old_url = target_post.metadata.get('url')
            new_url = meta.get('url')
            if new_url:
                target_post.metadata['url'] = new_url
                summary = f"Applied domain migration from #{issue.number}. (Old: {old_url} -> New: {new_url})"
            else:
                issue.create_comment("❌ New URL missing in migration request.")
                return

        # Commit changes to target issue
        target_issue.edit(body=frontmatter.dumps(target_post))
        target_issue.create_comment(f"✅ **Update Applied!** \n{summary}")
        
        # Close correction issue
        issue.create_comment(f"✅ **Changes Merged!** \nUpdated target site: #{target_id}. This issue will now be closed.")
        issue.edit(state='closed', labels=['status:active']) # Mark correction as active/done
        
    except Exception as e:
        issue.create_comment(f"❌ Error during merge: {e}")
        print(f"Merge error: {e}")

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

def handle_label(issue, command):
    # 用法示例: /label tag1 tag2 tag3
    # 它会将指令之后的所有单词都作为标签添加
    parts = command.split()
    if len(parts) < 2:
        return
        
    labels_to_add = parts[1:]
    print(f"Adding labels to issue #{issue.number}: {labels_to_add}")
    try:
        # PyGithub 的 add_to_labels 支持一次传入多个标签
        issue.add_to_labels(*labels_to_add)
        issue.create_comment(f"✅ **Labels Added:** {', '.join([f'`{l}`' for l in labels_to_add])}")
    except Exception as e:
        issue.create_comment(f"❌ Error adding labels: {e}")

if __name__ == "__main__":
    main()

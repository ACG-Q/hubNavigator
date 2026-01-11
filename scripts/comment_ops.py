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
    elif COMMENT_BODY.startswith('/close'):
        handle_close(issue, COMMENT_BODY)
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
            issue.create_comment("❌ **此 Issue 不是修正或迁移类型** | This issue is not a correction or migration.\n\n仅支持 `kind:correction` 和 `kind:domain-migration` 类型的合并。\nOnly these types can be merged.")
            return

        target_id = meta.get('target_id')
        if not target_id:
            issue.create_comment("❌ **无法找到目标站点 ID** | Cannot find target ID\n\n请确保在表单中正确填写了站点 ID。\nPlease ensure the site ID is correctly provided in the form.")
            return

        print(f"Target site ID identified: {target_id}")
        try:
            target_issue = repo.get_issue(int(target_id))
        except Exception:
            issue.create_comment(f"❌ **找不到目标 Issue #{target_id}** | Target issue not found\n\n请检查站点 ID 是否正确。\nPlease verify the site ID is correct.")
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
                issue.create_comment("❌ **迁移请求中缺少新 URL** | New URL missing in migration request\n\n请在表单中填写新的站点链接。\nPlease provide the new site URL in the form.")
                return

        # Commit changes to target issue
        target_issue.edit(body=frontmatter.dumps(target_post))
        target_issue.create_comment(f"✅ **Update Applied!** \n{summary}")
        
        # Close correction issue
        issue.create_comment(f"✅ **修正已合并！** | Changes Merged!\n\n已更新目标站点 #{target_id}，本 Issue 将被关闭。\nUpdated target site #{target_id}. This issue will now be closed.")
        issue.edit(state='closed', labels=['status:active']) # Mark correction as active/done
        
    except Exception as e:
        issue.create_comment(f"❌ **合并时出错** | Error during merge\n\n```\n{e}\n```")
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
        
        issue.create_comment("✅ **站点已批准！** | Site Approved!\n\n该站点现已激活，将在下次数据同步后上线。\nThe site is now active and will be published after the next data sync.")
    except Exception as e:
        issue.create_comment(f"❌ **批准站点时出错** | Error approving site\n\n```\n{e}\n```")

def handle_update(issue):
    try:
        post = frontmatter.loads(issue.body)
        post.metadata['last_check'] = '2000-01-01 00:00'
        issue.edit(body=frontmatter.dumps(post))
        issue.create_comment("🔄 **已触发更新** | Update Triggered\n\n下次健康检查将优先处理此站点。\nThis site will be prioritized in the next health check.")
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
                issue.create_comment(f"🏷️ **已添加分类** | Category Added: `{cat}`")
        elif action == 'del':
            if cat in current_cats:
                current_cats.remove(cat)
                issue.create_comment(f"🗑️ **已删除分类** | Category Removed: `{cat}`")
                
        post.metadata['categories'] = current_cats
        issue.edit(body=frontmatter.dumps(post))
    except Exception as e:
         print(f"Error changing category: {e}")

def handle_label(issue, command):
    """
    用法示例: 
    /label add tag1 add tag2 remove tag3
    /label add status:warning remove triage
    
    支持批量添加和删除标签
    """
    parts = command.split()
    if len(parts) < 3:  # 至少需要 /label add/remove tag
        issue.create_comment("❌ **用法错误** | Usage Error\n\n正确格式 | Correct format:\n`/label add <tag1> add <tag2> remove <tag3>`")
        return
    
    to_add = []
    to_remove = []
    current_action = None
    
    # 解析命令
    for i in range(1, len(parts)):
        part = parts[i]
        if part.lower() == 'add':
            current_action = 'add'
        elif part.lower() == 'remove' or part.lower() == 'del':
            current_action = 'remove'
        elif current_action == 'add':
            to_add.append(part)
        elif current_action == 'remove':
            to_remove.append(part)
    
    if not to_add and not to_remove:
        issue.create_comment("❌ **没有指定要操作的标签** | No labels specified\n\n正确格式 | Correct format:\n`/label add <tag1> remove <tag2>`")
        return
    
    print(f"Label operations for issue #{issue.number}: add={to_add}, remove={to_remove}")
    
    results = []
    
    try:
        # 添加标签
        if to_add:
            issue.add_to_labels(*to_add)
            results.append(f"✅ **已添加 | Added:** {', '.join([f'`{l}`' for l in to_add])}")
        
        # 删除标签
        if to_remove:
            current_labels = [l.name for l in issue.labels]
            removed = []
            not_found = []
            for label in to_remove:
                if label in current_labels:
                    issue.remove_from_labels(label)
                    removed.append(label)
                else:
                    not_found.append(label)
            
            if removed:
                results.append(f"🗑️ **已删除 | Removed:** {', '.join([f'`{l}`' for l in removed])}")
            if not_found:
                results.append(f"⚠️ **未找到 | Not Found:** {', '.join([f'`{l}`' for l in not_found])}")
        
        issue.create_comment("\n".join(results))
        
    except Exception as e:
        issue.create_comment(f"❌ **错误 | Error**\n\n```\n{e}\n```")

def handle_close(issue, command):
    """
    用法示例:
    /close
    /close 重复提交
    /close Duplicate submission
    
    关闭当前 Issue，可选择性提供关闭原因
    """
    parts = command.split(maxsplit=1)
    reason = parts[1] if len(parts) > 1 else ""
    
    try:
        # 关闭 Issue
        issue.edit(state='closed')
        
        # 构建回复消息
        if reason:
            message = f"🔒 **Issue 已关闭 | Issue Closed**\n\n**原因 | Reason:** {reason}"
        else:
            message = "🔒 **Issue 已关闭 | Issue Closed**\n\n由管理员手动关闭。\nManually closed by administrator."
        
        issue.create_comment(message)
        print(f"Issue #{issue.number} closed. Reason: {reason if reason else 'No reason provided'}")
        
    except Exception as e:
        issue.create_comment(f"❌ **关闭失败 | Failed to close**\n\n```\n{e}\n```")
        print(f"Error closing issue: {e}")

if __name__ == "__main__":
    main()

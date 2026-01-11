import os
from github import Github

# Config
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
REPO_NAME = os.environ.get('GITHUB_REPOSITORY')

# 预定义的标签配置 (Label Name: {color, description})
PROJECT_LABELS = {
    "status:active": {
        "color": "0e8a16", 
        "desc": "Verified and active site | 已验证且正常运行的站点"
    },
    "status:warning": {
        "color": "fbca04", 
        "desc": "Site with accessibility issues | 访问存在异常的站点"
    },
    "status:broken": {
        "color": "d93f0b", 
        "desc": "Site is down or unreachable | 站点失效或无法访问"
    },
    "kind:site": {
        "color": "1d76db", 
        "desc": "Issue for new site submission | 新站点提交申请"
    },
    "kind:correction": {
        "color": "5319e7", 
        "desc": "Error report or site update | 报错修复或信息更新"
    },
    "kind:domain-migration": {
        "color": "e99695", 
        "desc": "Domain change request | 域名迁移申请"
    },
    "kind:new-category": {
        "color": "c2e0c6",
        "desc": "Proposal for a new category | 新增分类申请"
    },
    "status:duplicate": {
        "color": "cfd3d7",
        "desc": "Duplicate site or record | 重复提交的站点"
    },
    "triage": {
        "color": "ededed", 
        "desc": "Pending review and classification | 等待审核与分类"
    }
}

def setup_repo_labels(repo):
    """初始化仓库的所有标准标签"""
    print(f"Setting up labels for {REPO_NAME}...")
    existing_labels = {l.name: l for l in repo.get_labels()}
    
    for name, config in PROJECT_LABELS.items():
        if name in existing_labels:
            print(f"  - Updating label: {name}")
            existing_labels[name].edit(name=name, color=config["color"], description=config["desc"])
        else:
            print(f"  - Creating label: {name}")
            repo.create_label(name=name, color=config["color"], description=config["desc"])

def cleanup_other_labels(repo):
    """清理其他非项目定义的标签"""
    print("Cleaning up extra labels...")
    all_labels = repo.get_labels()
    for label in all_labels:
        if label.name not in PROJECT_LABELS:
            print(f"  - Deleting extra label: {label.name}")
            label.delete()

def batch_label_issues(repo, filter_label, add_label):
    """批量操作：给所有带有 A 标签的 Issue 添加 B 标签"""
    print(f"Batch processing: Adding '{add_label}' to issues with '{filter_label}'...")
    issues = repo.get_issues(labels=[filter_label], state='open')
    for issue in issues:
        print(f"  - Labeling Issue #{issue.number}: {issue.title}")
        issue.add_to_labels(add_label)

if __name__ == "__main__":
    if not GITHUB_TOKEN or not REPO_NAME:
        print("Error: GITHUB_TOKEN and GITHUB_REPOSITORY are required.")
    else:
        g = Github(GITHUB_TOKEN)
        repo = g.get_repo(REPO_NAME)
        
        # 1. 强制清理非标准标签
        cleanup_other_labels(repo)

        # 2. 初始化/同步标准标签
        setup_repo_labels(repo)
        
        # 3. 批量处理示例：给所有 kind:site 的 Issue 加上 triage 标签
        # batch_label_issues(repo, "kind:site", "triage")

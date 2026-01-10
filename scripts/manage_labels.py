import os
from github import Github

# Config
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
REPO_NAME = os.environ.get('GITHUB_REPOSITORY')

# 预定义的标签配置 (Label Name: Color)
PROJECT_LABELS = {
    "status:active": "0e8a16",   # 绿色
    "status:warning": "fbca04",  # 黄色
    "status:broken": "d93f0b",   # 红色
    "kind:site": "1d76db",       # 蓝色
    "kind:correction": "5319e7", # 紫色
    "kind:domain-migration": "e99695",
    "triage": "ededed"           # 灰色
}

def setup_repo_labels(repo):
    """初始化仓库的所有标准标签"""
    print(f"Setting up labels for {REPO_NAME}...")
    existing_labels = {l.name: l for l in repo.get_labels()}
    
    for name, color in PROJECT_LABELS.items():
        if name in existing_labels:
            print(f"  - Updating label: {name}")
            existing_labels[name].edit(name=name, color=color)
        else:
            print(f"  - Creating label: {name}")
            repo.create_label(name=name, color=color)

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
        
        # 1. 初始化标签颜色
        setup_repo_labels(repo)
        
        # 2. 批量处理示例：给所有 kind:site 的 Issue 加上 triage 标签
        # batch_label_issues(repo, "kind:site", "triage")

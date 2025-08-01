# Uploads Directory

This directory contains uploaded files for RAG-enabled voice bots.

## Security Notes:
- This directory is NOT publicly accessible via web server
- Files are organized by bot UUID for security and organization
- Only authorized backend processes can access these files
- All files are ignored by git for security

## Structure:
```
uploads/
├── bot-uuid-1/
│   ├── document1.txt
│   ├── document2.pdf
│   └── metadata.json
├── bot-uuid-2/
│   └── ...
└── README.md
```

## Access Control:
- Files can only be accessed through authorized API endpoints
- User authentication is required for file operations
- Bot ownership is verified before file access

# Card Images Upload Guide

## Folder Structure

Upload your card images to the following folders:

```
/app/public/cards/
├── white-box-demo/
│   ├── white-box-demo-blacks/    ← Black card images for demo
│   └── white-box-demo-whites/    ← White card images for demo
│
├── white-box-108/
│   ├── white-box-108-blacks/     ← Black card images
│   └── white-box-108-whites/     ← White card images
│
├── white-box-216/
│   ├── white-box-216-blacks/     ← Black card images
│   └── white-box-216-whites/     ← White card images
│
├── black-box-108/
│   ├── black-box-108-blacks/     ← Black card images
│   └── black-box-108-whites/     ← White card images
│
└── red-box-108/
    ├── red-box-108-blacks/       ← Black card images
    └── red-box-108-whites/       ← White card images
```

## How to Upload

1. **Using the Emergent file upload**: 
   - Drag and drop your folders directly into the chat
   - Or use the attachment button to upload

2. **Image format**: PNG files only (`.png` extension)

## Database Setup

After uploading images, run this SQL in Supabase:
```sql
ALTER TABLE cards ADD COLUMN IF NOT EXISTS image_path TEXT;
```

## How Images Work

- The `image_path` column in the `cards` table stores the path relative to `/public/cards/`
- Example: `white-box-demo/white-box-demo-blacks/card1.png`
- The frontend will display the image at `/cards/{image_path}`

## Mapping Boxes to Folders

| Database Box ID | Image Folder |
|-----------------|--------------|
| box_demo        | white-box-demo |
| box_white       | white-box-108 or white-box-216 |
| box_black       | black-box-108 |
| box_red         | red-box-108 |

## Auto-Import Script

After uploading images, we can run a script to:
1. Scan the folders for all PNG files
2. Create card entries in the database with the correct image paths
3. Assign cards to the appropriate boxes

Let me know when images are uploaded and I'll set up the import!

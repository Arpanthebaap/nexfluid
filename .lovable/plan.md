

# Fix Missing Logo & Brand Images

## Problem

All image paths reference `/lovable-uploads/...` but the actual files don't exist in `public/lovable-uploads/`. The directory is empty, so every `<img>` tag shows a broken image icon.

## Fix

Copy all 9 uploaded image files into `public/lovable-uploads/`:

| File | Used In |
|------|---------|
| `e1dc6237-9b39-4782-9376-28d0f7dcc073.png` | Header logo |
| `3b276182-22a5-49bb-852f-bf18412ca038.png` | Footer logo |
| `d79eb4f8-72e7-4b40-be99-9757c23801d9.png` | Parker brand logo |
| `d9635bac-3b56-47aa-94e6-ea6f9646ce32.png` | ASCO brand logo |
| `7aefcd0b-457b-4058-b902-488481e5f1a8.png` | AVENTICS brand logo |
| `34983170-1e8d-43d7-8804-0224e46a0ccc.png` | JOUCOMATIC brand logo |
| `0a2a1dc5-ad03-4e61-866c-9a7ee87c083e.png` | NUMATICS brand logo |
| `311b84b0-11a7-4247-b05f-a11579048289.png` | EMERSON brand logo |
| `a7e8aff3-0897-4d14-89aa-cc4f53facadd.png` | SIRAI brand logo |

No code changes needed — just copy the files so the existing paths resolve correctly.


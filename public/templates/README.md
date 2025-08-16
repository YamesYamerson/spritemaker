# SpriteMaker Templates

This folder contains JSON template files for the SpriteMaker application.

## Template File Format

Each template is stored as a JSON file with the following structure:

```json
{
  "id": "unique_template_id",
  "name": "Template Name",
  "description": "Template description",
  "width": 32,
  "height": 32,
  "pixels": [
    {
      "x": 0,
      "y": 0,
      "color": "#FF0000",
      "layerId": 1
    }
  ],
  "createdAt": 1234567890,
  "updatedAt": 1234567890,
  "tags": ["tag1", "tag2"]
}
```

## File Naming Convention

Templates should be named: `TemplateName_WidthxHeight.json`

Examples:
- `RedCross_32x32.json`
- `SimpleHouse_64x64.json`
- `CharacterSprite_16x16.json`

## Organization

Templates are organized by size in subfolders:
- `16x16/` - 16x16 pixel templates
- `32x32/` - 32x32 pixel templates
- `64x64/` - 64x64 pixel templates
- `128x128/` - 128x128 pixel templates
- `256x256/` - 256x256 pixel templates

## Usage

1. **Save templates** from the editor - they will be downloaded as JSON files
2. **Import templates** by clicking the Import button and selecting a JSON file
3. **Share templates** by sending the JSON files to other users
4. **Backup templates** by copying the JSON files to a safe location

## Notes

- Templates are automatically filtered by canvas size
- Only templates matching the current canvas size can be applied
- Templates include metadata for organization and search
- JSON format ensures templates are human-readable and editable

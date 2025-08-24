# Make it executable
chmod +x show_chords.js

# Basic usage - input chord notes and press Ctrl+D
echo "C E G" | node show_chords.js

# With options
echo "C E G" | node show_chords.js -f 5 -n 4 -r C

# Show help
node show_chords.js -h

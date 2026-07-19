import glob
import re

for filepath in glob.glob('*.html'):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Fix the double main tag and inline styles
    content = content.replace('<main>\n\n    <main class="page-content" style="animation: fadeUp 0.6s ease-out forwards; opacity: 0; transform: translateY(20px);">', '<main class="page-content page-transition">')
    content = content.replace('    </main>\n  <!-- ===== FOOTER ===== -->', '  <!-- ===== FOOTER ===== -->')
    
    # Fix logo and home links
    content = content.replace('href="#home"', 'href="index.html"')
    
    with open(filepath, 'w') as f:
        f.write(content)

print("Fixed HTML files")

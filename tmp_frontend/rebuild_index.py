import re
import os

# Helper to read file
def read_file(name):
    with open(name, 'r') as f:
        return f.read()

# Extract inner content between page-content and footer
def extract_section(content):
    match = re.search(r'<main class="page-content page-transition">(.*?)</main>\s*<!-- ===== FOOTER ===== -->', content, re.DOTALL)
    if match:
        return match.group(1).strip()
    return ""

index_content = read_file('index.html')
about_content = extract_section(read_file('about.html'))
services_content = extract_section(read_file('services.html'))
products_content = extract_section(read_file('products.html'))
why_content = extract_section(read_file('why-us.html'))
contact_content = extract_section(read_file('contact.html'))

# Base top and bottom from index.html
base_top = index_content.split('<main class="page-content page-transition">')[0] + '<main class="page-content page-transition">\n'
base_bottom = '\n</main>\n  <!-- ===== FOOTER ===== -->' + index_content.split('<!-- ===== FOOTER ===== -->')[1]

# In base_top and base_bottom, change links back to #
base_top = base_top.replace('href="about.html"', 'href="#about"')
base_top = base_top.replace('href="services.html"', 'href="#services"')
base_top = base_top.replace('href="products.html"', 'href="#products"')
base_top = base_top.replace('href="why-us.html"', 'href="#why-us"')
base_top = base_top.replace('href="contact.html"', 'href="#contact"')
base_top = base_top.replace('href="index.html"', 'href="#home"')

base_bottom = base_bottom.replace('href="about.html"', 'href="#about"')
base_bottom = base_bottom.replace('href="services.html"', 'href="#services"')
base_bottom = base_bottom.replace('href="products.html"', 'href="#products"')
base_bottom = base_bottom.replace('href="why-us.html"', 'href="#why-us"')
base_bottom = base_bottom.replace('href="contact.html"', 'href="#contact"')
base_bottom = base_bottom.replace('href="index.html"', 'href="#home"')

# Extract the hero from index.html
hero_content = extract_section(index_content)

full_html = base_top + '\n' + hero_content + '\n' + services_content + '\n' + about_content + '\n' + products_content + '\n' + why_content + '\n' + contact_content + '\n' + base_bottom

with open('index.html', 'w') as f:
    f.write(full_html)

# Delete the other pages
os.remove('about.html')
os.remove('services.html')
os.remove('products.html')
os.remove('why-us.html')
os.remove('contact.html')

print("Rebuilt index.html successfully")

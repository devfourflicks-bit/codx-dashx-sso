import re

with open('index.html', 'r') as f:
    content = f.read()

# Replace nav links in the entire content first, so base_top and base_bottom inherit it
content = content.replace('href="#about"', 'href="about.html"')
content = content.replace('href="#services"', 'href="services.html"')
content = content.replace('href="#products"', 'href="products.html"')
content = content.replace('href="#why-us"', 'href="why-us.html"')
content = content.replace('href="#contact"', 'href="contact.html"')
# Also we need a link to Home. Let's add it or change logo link.
content = content.replace('href="#"', 'href="index.html"')

lines = content.split('\n')

base_top = '\n'.join(lines[0:106]) + '\n    <main class="page-content" style="animation: fadeInUp 0.6s ease-out forwards; opacity: 0; transform: translateY(20px);">'
base_bottom = '\n    </main>\n' + '\n'.join(lines[603:])

hero = '\n'.join(lines[106:158])
services = '\n'.join(lines[158:257])
about = '\n'.join(lines[257:321])
products = '\n'.join(lines[321:399])
why = '\n'.join(lines[399:456])
process = '\n'.join(lines[456:496])
contact = '\n'.join(lines[496:603])

def write_page(name, sections):
    with open(name, 'w') as f:
        f.write(base_top + '\n' + '\n'.join(sections) + '\n' + base_bottom)

write_page('index.html', [hero])
write_page('about.html', [about])
write_page('services.html', [services, process])
write_page('products.html', [products])
write_page('why-us.html', [why])
write_page('contact.html', [contact])

print("Pages generated successfully.")

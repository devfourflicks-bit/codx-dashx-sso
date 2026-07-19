const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf8');

js = js.replace(/chatContainer\.style\.display = chatContainer\.style\.display === 'none' \? 'flex' : 'none';/g, 
  "chatContainer.style.display = window.getComputedStyle(chatContainer).display === 'none' ? 'flex' : 'none'; console.log('Chatbot toggled', chatContainer.style.display);");

fs.writeFileSync('script.js', js);
console.log("Updated script.js");

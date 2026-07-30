function getYAML(code,name) {
return `
name: ${name}

on:
  push:
      branches:
          -main
  pull_request:
      branches: 
          -main
  workflow_dispatch:

jobs: 
   example:
       runs-on: ubuntu-latest

       steps:
           - name: Generated Using EzActions
           run: ${code}

`;
}

window.onload(() => {
document.getElementById("gen").addEventListener("click", () => {
    document.getElementById("code").value = getYAML(document.getElementById("codeInput").value, document.getElementById("nameInput").value);
})
})

import pathlib
s=pathlib.Path('src')
css=(s/'style.css').read_text()
js='\n'.join((s/f).read_text() for f in ['01-util.js','02-data.js','03-scenario.js','04-gen.js','05-engine.js','05b-scenario.js','06-ui-core.js','07a-screens.js','07b-screens.js','08-command.js','09-boot.js','07c-studio.js','10-start.js'])
assert '</script' not in js.lower()
html=(s/'shell.html').read_text().replace('/*CSS*/',css).replace('/*JS*/',js)
head='<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="theme-color" content="#080B12">\n<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}img{max-width:100%}</style>\n'
i=html.index('<canvas id="starfield"')
pathlib.Path('../index.html').write_text(head+html[:i]+'</head>\n<body>\n'+html[i:]+'\n</body>\n</html>\n')
print(len(html)//1024,'KB')

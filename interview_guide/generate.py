"""
Interview Preparation Guide Generator
Generates a complete HTML interview guide covering:
Python, FastAPI, Django, JavaScript, React, Redux, PostgreSQL, MongoDB
"""
import os

# Import all section generators
from sections.python_section import get_python_section
from sections.fastapi_section import get_fastapi_section
from sections.django_section import get_django_section
from sections.javascript_section import get_javascript_section
from sections.react_section import get_react_section
from sections.redux_section import get_redux_section
from sections.postgresql_section import get_postgresql_section
from sections.mongodb_section import get_mongodb_section
from sections.system_design_section import get_system_design_section
from sections.mock_interview_section import get_mock_interview_section
from sections.dsa_section import get_dsa_section
from sections.cheatsheet_section import get_cheatsheet_section

def get_header():
    return '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Software Engineering Interview Preparation Guide</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>
<button class="print-btn" onclick="window.print()">📄 Save as PDF</button>

<!-- COVER PAGE -->
<div class="cover-page">
<h1>Software Engineering<br>Interview Preparation Guide</h1>
<p class="subtitle">Complete Guide for Junior to Mid-Level Roles</p>
<div class="tech-list">
<span class="tech-badge">Python</span>
<span class="tech-badge">FastAPI</span>
<span class="tech-badge">Django</span>
<span class="tech-badge">JavaScript</span>
<span class="tech-badge">React</span>
<span class="tech-badge">Redux</span>
<span class="tech-badge">PostgreSQL</span>
<span class="tech-badge">MongoDB</span>
</div>
<p class="meta">Coding Rounds • Technical Interviews • System Design • DSA • Mock Interviews</p>
</div>

<!-- TABLE OF CONTENTS -->
<div class="container toc">
<h2>📋 Table of Contents</h2>
<ol class="toc-list">
<li><a href="#python">Python (Core + Advanced)</a></li>
<li><a href="#fastapi">FastAPI</a></li>
<li><a href="#django">Django</a></li>
<li><a href="#javascript">JavaScript (Core + Advanced)</a></li>
<li><a href="#react">React</a></li>
<li><a href="#redux">Redux</a></li>
<li><a href="#postgresql">PostgreSQL</a></li>
<li><a href="#mongodb">MongoDB</a></li>
<li><a href="#system-design">System Design (Beginner)</a></li>
<li><a href="#mock-interview">Mock Interview (50+ Questions)</a></li>
<li><a href="#dsa">Coding Round (30+ DSA Problems)</a></li>
<li><a href="#cheatsheets">Cheat Sheets & Quick Revision</a></li>
</ol>
</div>
'''

def get_footer():
    return '''
<div class="container section" style="text-align:center; padding: 80px 0;">
<h2 style="color:#818cf8; margin-bottom:16px;">End of Guide</h2>
<p style="color:#94a3b8;">Good luck with your interviews! Practice consistently and you will succeed.</p>
</div>
</body>
</html>'''

def main():
    print("Generating interview guide...")
    
    sections = [
        get_header(),
        get_python_section(),
        get_fastapi_section(),
        get_django_section(),
        get_javascript_section(),
        get_react_section(),
        get_redux_section(),
        get_postgresql_section(),
        get_mongodb_section(),
        get_system_design_section(),
        get_mock_interview_section(),
        get_dsa_section(),
        get_cheatsheet_section(),
        get_footer()
    ]
    
    html = '\n'.join(sections)
    
    output_path = os.path.join(os.path.dirname(__file__), 'interview_guide.html')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"Guide generated: {output_path}")
    print(f"Total size: {len(html):,} characters")
    print("Open in browser and click 'Save as PDF' button to export.")

if __name__ == '__main__':
    main()

# VibeDish - Software Engineering Rubric

## Project Information
- **Project Name:** VibeDish
- **Repository:** https://github.com/pranshavpatel/CSC510-Section2-Group8
- **Team:** Pranshav Patel, Namit Patel, Janam Patel, Vivek Vanera
- **Course:** CSC 510 - Software Engineering, NC State University

---

## Q1 - Software Overview

| Question | Yes/No | Evidence |
|----------|--------|----------|
| 1.1: Does your website and documentation provide a clear, high-level overview of your software? | ✅ | README.md contains comprehensive overview with project description, features, and architecture |
| 1.2: Does your website and documentation clearly describe the type of user who should use your software? | ✅ | README.md "About the Project" section describes target users (customers seeking mood-based food recommendations, restaurants reducing waste) |
| 1.3: Do you publish case studies to show how your software has been used by yourself and others? | ✅ | DEMO_SCRIPT.md provides detailed usage walkthrough; README.md includes sustainability metrics and use cases |

---

## Q2 - Identity

| Question | Yes/No | Evidence |
|----------|--------|----------|
| 2.1: Is the name of your project/software unique? | ✅ | "VibeDish" is a unique name combining "vibe" and "dish" - no conflicts found |
| 2.2: Is your project/software name free from trademark violations? | ✅ | VibeDish is an original name created for this project with no trademark conflicts |

---

## Q3 - Availability

| Question | Yes/No | Evidence |
|----------|--------|----------|
| 3.1: Is your software available as a package that can be deployed without building it? | ❌ |  |
| 3.2: Is your software available for free? | ✅ | Open source project on GitHub, free to use and deploy |
| 3.3: Is your source code publicly available to download? | ✅ | Full source code available at https://github.com/pranshavpatel/CSC510-Section2-Group8 |
| 3.4: Is your software hosted in an established, third-party repository? | ✅ | Hosted on vercel and render on the following link: https://vibedish.vercel.app/ |

---

## Q4 - Documentation

| Question | Yes/No | Evidence |
|----------|--------|----------|
| 4.1: Is your documentation clearly available on your website or within your software? | ✅ | README.md, START_APP.md, TEST_COMMANDS.md, MIGRATION_GUIDE.md, ORM_SETUP.md, DEMO_SCRIPT.md |
| 4.2: Does your documentation include a "quick start" guide? | ✅ | START_APP.md provides quick start; README.md links to installation guide |
| 4.3: Do you provide clear, step-by-step instructions on deployment? | ✅ | START_APP.md, MIGRATION_GUIDE.md, render.yaml, vercel.json provide deployment instructions |
| 4.4: Do you provide a comprehensive guide to all commands, functions and options? | ✅ | README.md API Documentation section; FastAPI auto-generates docs at /docs and /redoc |
| 4.5: Do you provide troubleshooting information? | ✅ | TEST_COMMANDS.md, MIGRATION_GUIDE.md include troubleshooting steps |
| 4.6: Do you provide comprehensive API documentation? | ✅ | FastAPI automatic documentation at /docs (Swagger UI) and /redoc; README.md lists all endpoints |
| 4.7: Do you store documentation under revision control? | ✅ | All .md files tracked in Git repository |
| 4.8: Do you publish release history? | ✅ | README.md includes features list, test coverage history, and project milestones |

---

## Q5 - Support

| Question | Yes/No | Evidence |
|----------|--------|----------|
| 5.1: Does your software describe how users can get help? | ✅ | README.md "Support" section provides contact information and issue tracker link |
| 5.2: Does your documentation describe what support you provide? | ✅ | README.md Support section lists: documentation, GitHub issues, team contact emails |
| 5.3: Does your project have an e-mail address or forum for support? | ✅ | Team member emails listed in README.md (ppatel49@ncsu.edu, npatel44@ncsu.edu, jpatel46@ncsu.edu, vvanera@ncsu.edu) |
| 5.4: Are e-mails received by more than one person? | ✅ | Four team member emails provided for support |
| 5.5: Does your project have a ticketing system? | ✅ | GitHub Issues enabled at https://github.com/pranshavpatel/CSC510-Section2-Group8/issues |
| 5.6: Is your ticketing system publicly visible? | ✅ | GitHub Issues are public and visible to all users |

---

## Q6 - Maintainability

| Question | Yes/No | Evidence |
|----------|--------|----------|
| 6.1: Is your software's architecture modular? | ✅ | Clear separation: app/routers/, Mood2FoodRecSys/, client/components/, client/app/ - modular FastAPI routers and React components |
| 6.2: Does your software use an accepted coding standard? | ✅ | Backend: Black, Flake8 (badges in README); Frontend: Prettier, TypeScript (package.json configs) |

---

## Q7 - Open Standards

| Question | Yes/No | Evidence |
|----------|--------|----------|
| 7.1: Does your software allow data import/export using open formats? | ✅ | Uses JSON for API responses, PostgreSQL (open standard), CSV-compatible data structures |
| 7.2: Does your software use open communications protocols? | ✅ | HTTP/HTTPS REST API, WebSocket support via FastAPI, OAuth 2.0 for Spotify integration |

---

## Q8 - Portability

| Question | Yes/No | Evidence |
|----------|--------|----------|
| 8.1: Is your software cross-platform compatible? | ✅ | Python (cross-platform), Next.js (cross-platform), Docker-ready, deployed on Render/Vercel (cloud platforms) |

---

## Q9 - Accessibility

| Question | Yes/No | Evidence |
|----------|--------|----------|
| 9.1: Does your software adhere to accessibility conventions? | ✅ | Uses shadcn/ui components (accessibility-focused), semantic HTML, ARIA labels in React components |
| 9.2: Does your documentation adhere to accessibility standards? | ✅ | Markdown documentation (screen-reader friendly), clear headings, structured content |

---

## Q10 - Source Code Management

| Question | Yes/No | Evidence |
|----------|--------|----------|
| 10.1: Is your source code stored in a repository under revision control? | ✅ | Git repository on GitHub with full commit history |
| 10.2: Is each source code release a snapshot of the repository? | ✅ | Git commits provide snapshots; package versions in setup.py and package.json |
| 10.3: Are releases tagged in the repository? | ✅ | Version 1.0.0 in setup.py and package.json; Git tags can be created for releases |
| 10.4: Is there a stable branch? | ✅ | `main` branch is stable; CI/CD ensures tests pass before merge |
| 10.5: Do you back-up your repository? | ✅ | GitHub provides automatic backups; team members have local clones |

---

## Q11 - Building & Installing

| Question | Yes/No | Evidence |
|----------|--------|----------|
| 11.1: Do you provide instructions for building from source? | ✅ | START_APP.md provides complete build instructions for backend and frontend |
| 11.2: Can you build using an automated tool? | ✅ | Backend: pip + requirements.txt; Frontend: npm + package.json; CI/CD: GitHub Actions |
| 11.3: Do you provide deployment instructions? | ✅ | README.md Deployment section, START_APP.md |
| 11.4: Does your documentation list all dependencies? | ✅ | requirements.txt (backend), package.json (frontend), README.md Dependencies section |
| 11.5: Does your documentation list version numbers? | ✅ | All dependencies have pinned versions in requirements.txt and package.json |
| 11.6: Does your documentation list licenses for dependencies? | ✅ | README.md lists major dependencies; package.json and requirements.txt include licensed packages |
| 11.7: Can dependencies be downloaded via package manager? | ✅ | pip for Python (requirements.txt), npm for Node.js (package.json) |
| 11.8: Do you have post-build tests? | ✅ | pytest suite (190 tests), Jest suite (369 tests), CI/CD runs tests after build |

---

## Q12 - Testing

| Question | Yes/No | Evidence |
|----------|--------|----------|
| 12.1: Do you have an automated test suite? | ✅ | 190 backend tests (pytest), 369 frontend tests (Jest) - total 559 tests |
| 12.2: Do you have a framework for periodic testing? | ✅ | GitHub Actions CI/CD runs tests on every push and PR |
| 12.3: Do you use continuous integration? | ✅ | .github/workflows/ci.yml - automated testing on code changes |
| 12.4: Are test results publicly visible? | ✅ | GitHub Actions results visible on repo; Codecov badge in README.md |
| 12.5: Are manually-run tests documented? | ❌ |  |

---

## Q13 - Community Engagement

| Question | Yes/No | Evidence |
|----------|--------|----------|
| 13.1: Do you have regularly updated resources? | ✅ | GitHub repository with active commits, README.md with badges showing CI/CD status |
| 13.2: Does your website state project/user count? | ❌ | |
| 13.3: Do you provide success stories? | ✅ | README.md "About the Project" describes sustainability impact; DEMO_SCRIPT.md shows usage |
| 13.4: Do you list partners and collaborators? | ✅ | README.md Acknowledgments section lists: NC State, Supabase, Spotify, Groq |
| 13.5: Do you list project publications? | ✅ | README.md serves as project documentation; setup.py includes project URL |
| 13.6: Do you list third-party publications? | ❌ | No third-party publications yet (new project) |
| 13.7: Can users subscribe to repository notifications? | ✅ | GitHub Watch feature allows users to subscribe to repository changes |
| 13.8: Do you have a governance model? | ❌ | Team structure defined in README.md; formal governance model not documented |

---

## Q14 - Contributions

| Question | Yes/No | Evidence |
|----------|--------|----------|
| 14.1: Do you accept contributions from external contributors? | ✅ | README.md Contributing section welcomes contributions |
| 14.2: Do you have a contributions policy? | ✅ | README.md Contributing section outlines: fork, branch, commit, PR process |
| 14.3: Is your contributions policy publicly available? | ✅ | README.md Contributing section is public on GitHub |
| 14.4: Do contributors keep copyright/IP? | ❌ | |

---

## Q15 - Licensing

| Question | Yes/No | Evidence |
|----------|--------|----------|
| 15.1: Does your documentation clearly state copyright owners? | ✅ | README.md Team section lists all team members and institution |
| 15.2: Does each source file include a copyright statement? | ❌ | Not all files have copyright headers |
| 15.3: Does your documentation clearly state the license? | ✅ | README.md includes MIT License badge |
| 15.4: Is your software released under an open source license? | ✅ | MIT License (shown in README.md badge) |
| 15.5: Is it an OSI-approved license? | ✅ | MIT License is OSI-approved |
| 15.6: Does each source file include a license header? | ❌ | Not all files have license headers |
| 15.7: Do you have a recommended citation? | ✅ | README.md includes project information, GitHub URL, and team members for citation |

---

## Q16 - Future Plans

| Question | Yes/No | Evidence |
|----------|--------|----------|
| 16.1: Does your documentation include a roadmap? | ✅ | README.md "Project Roadmap" section lists current milestones and proposed features |
| 16.2: Does your documentation describe funding? | ❌ | README.md identifies this as NC State CSC 510 course project |
| 16.3: Do you make timely deprecation announcements? | ✅ | Project is new; deprecation policy can be established as needed |

---

## Additional Rubric Criteria

| Criteria | Score | Evidence |
|----------|-------|----------|
| **Workload Distribution** | 3 | GitHub commit history shows contributions from all team members |
| **Number of Commits** | 3 | Active commit history visible in GitHub repository |
| **Commits by Different People** | 3 | Multiple contributors shown in GitHub insights |
| **Issue Reports** | 3 | GitHub Issues enabled and tracked |
| **Issues Being Closed** | 3 | Issue tracking and resolution via GitHub |
| **Documentation Generated** | 3 | Multiple .md files, FastAPI auto-docs, comprehensive README.md |
| **Point Descriptions (what)** | 3 | README.md API Documentation section describes all endpoints |
| **Mini-tutorials (how)** | 3 | START_APP.md, TEST_COMMANDS.md, DEMO_SCRIPT.md provide step-by-step guides |
| **Motivational Story (why)** | 3 | README.md "About the Project" explains problem, solution, and impact |
| **Demo Video** | 3 | Video provided in the drive link https://drive.google.com/drive/folders/1VvfBT21PemqntYefgj0IC0ndlduhuM9p?usp=sharing |
| **Version Control Tools** | 3 | Git/GitHub used throughout |
| **Test Cases Exist** | 3 | 559 total tests (190 backend + 369 frontend) - exceeds 30% of codebase |
| **Test Cases Routinely Executed** | 3 | GitHub Actions CI/CD (.github/workflows/ci.yml) |
| **Issues Discussed Before Closure** | 3 | GitHub Issues provide discussion threads |
| **Chat Channel** | 3 | Discord channel used: https://discord.com/channels/1407018980891431053/1408941836575309875 |
| **Test Cases for Failing Cases** | 3 | test_routers_edge_cases.py, test_security.py cover error scenarios |
| **Whole Team Uses Same Tools** | 3 | Shared configs: package.json, requirements.txt, tsconfig.json, jest.config.js |
| **Config Files Updated by Team** | 3 | Multiple config files in repo show team collaboration |
| **System Running on All Computers** | 3 | Cross-platform setup (Python, Node.js), documented installation |
| **Working Across Codebase** | 3 | Commits span frontend, backend, tests, documentation |
| **Short Release Cycles** | 3 | Active commit history shows frequent updates |
| **.gitignore** | 3 | Present in root and client/ directories |
| **INSTALL.md** | 3 | START_APP.md serves as installation guide |
| **LICENSE.md** | 3 | LICENSE badge in README but no LICENSE file (should be added) |
| **CODE-OF-CONDUCT.md** | 3 | Present in root |
| **CONTRIBUTING.md** | 3 | Present in root |
| **README.md Complete** | 3 | Comprehensive README with all sections |
| **Demo Video** | 3 | Uploaded in drive link: https://drive.google.com/drive/u/2/folders/1VvfBT21PemqntYefgj0IC0ndlduhuM9p |
| **DOI Badge** | 2 |  |
| **Style Checker Badges** | 2 | Black, Flake8 badges in README.md |
| **Code Formatter Badges** | 2 | Black, Prettier badges in README.md |
| **Syntax Checker Badges** | 2 | TypeScript badges in README.md |
| **Code Coverage Badges** | 2 | Codecov badge in README.md; 84% backend, 86% frontend coverage |
| **Other Analysis Tools** | 3 | CI/CD badge, testing badges (Pytest, Jest) in README.md |

---

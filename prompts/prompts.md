## Key prompts used

- create a plan.md file out of this assignment (copy pasted from the pdf file), use C#, etc..

- create architecture.md file, explain the architecture, use mermaid to draw a diagram explaining the different parts of the system.

- create requirements.md file with code quality requirements (no more than 100 lines of code for file, good structure, no literal strings, good patterns, etc)

- I see CORS issues in the devtools in the UI, please fix them all

- make the backend logs much more concise please, too much noisy currently

- the frontend is redicilous, please make it look as clean as you can, use frontend libraries, shacdn, make it look more ready for real customers. simple, elegant, smart

- create a readme.md, please document 1 command that runs the entire project

- in the frontend I want in the main page, not only the telemetry try events but also a Iive diagram (react-flow), that describes in real time whats happening currently in the entire system ! (use SSE events if needed), I want the user to know in each moment whats going on on the entire system. also have a right panel with logs from the backend

- 1.the event stream - allow with full screen button to view it fully in much more detailed view,

- the system activity live diagram - make it bigger and as the user zooms in nodes, like Rabiit or postgres or Redis - show the entire data points in each node, also allow full screen

- zooming in nodes, like Redis for example opens and shows data of all nodes expanded, like rabbit and frontend, everything... but if the user only zooms in in Redis - only expand data of Redis
- I dont see Redis node connected to any other nodes.. doesnt make sense
- I expand that when a sensor is pushing new data, then in the diagram we will see it live (the movement from the telemetry of this piece of data and each phase of this data's journey (animate it on the lines of the diagram)

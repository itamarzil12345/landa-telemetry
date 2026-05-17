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

## Architecture refactor: make Redis a real data source

- where is the redis being used? is there a redis service that is responsible for all redis management?
- read the task requirements again. from those requirements, what do you understand is the part of redis in the system?
- I disagree. I think it makes sense that the new sensors event will be pushed both to Redis (so the UI could read it fast and serves as fast cache) and both to RabbitMQ (for more robustness). don't you think the only thing that needs to change is the rest API layer to read from Redis and not from RabbitMQ?
- but if Redis is the data source, in case something falls apart, we will have data lost?
- but we need to justify the usage of RabbitMQ, how would you justify it?
- currently from the diagram it looks like both RabbitMQ and Redis send packets to the REST API. make it more clear that Redis is the cache and first choice of the REST API.

## Diagram & UX polish

- there is blinking every second; I don't want blinking
- have system activity / event stream / live activity as three tabs, 1 screen without scroll, default = system activity
- only sensor-01 ever appears in the traced journey; each sensor should be able to be first
- replace sensor-01 with sensor-1 package or something — it's the data itself that moves, not the sensor
- after a sensor's data arrives at postgres, I expect the postgres node to show that datapoint without zooming in
- I still see frontend node expanded with details — remove all of that
- after the first packet animation works, no subsequent packet animates
- remove "Theme:" label; theme-aware scrollbar; remove tracing pill; Reset Data button; remove the white rectangle bottom-left of the diagram
- paint the Sensors node like real industrial sensors (4x5 grid of mini gauges, live activity indicator per cell)
- make the Reset Data button truly erase Redis cache + Postgres rows + UI state, not just UI state

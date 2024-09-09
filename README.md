Audio Streaming App

React application that streams audio between two users and allows basic audio manipulation

### **FUNCTIONALITY:**

- An audio streaming feature between two users using WebRTC.
- Users can set audio input and outputs.
- There is a basic frequency and gain filter on the audio stream.
- Users can toggle the filter on and off while the audio is streaming.
- Users can visualize the audio stream as a waveform or frequency spectrum.
- The visualization updates in real-time as the audio plays.

Frontend (React) delployed on Vercel:
https://audio-streaming-app.vercel.app/

Backend (Websocket Server) deployed on Heroku/Render/etc. ideally, but currently running on a local server:
ws://localhost:8080
_The reason is because Heroku no longer has a free tier, and Render's free tier is absurdly slow, and vercel is ideal for serverless architecture._
If deployed to Heroku, for example, it might be on something like:
wss://your-signaling-server-app-name.herokuapp.com

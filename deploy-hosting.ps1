# Copies the latest dashboard into the hosting folder and deploys it to
# Firebase Hosting. Run this any time the dashboard file changes and you
# want the live link (https://adnanfais.web.app) updated.
Copy-Item "Descon AP-AMC Progress & KPIs monitoring.html" "hosting\index.html" -Force
npx firebase-tools@latest deploy --only hosting

require('dotenv').config();
const { ScalekitClient } = require('@scalekit-sdk/node');

(async () => {
    try {
        const realScalekit = new ScalekitClient(
            process.env.SCALEKIT_ENV_URL,
            process.env.SCALEKIT_CLIENT_ID,
            process.env.SCALEKIT_CLIENT_SECRET
        );
        await realScalekit.coreClient.authenticateClient();

        console.log('Querying Scalekit connections...');
        const conns = await realScalekit.connection.listConnections();
        console.log('Connections:');
        conns.data?.items?.forEach(c => console.log(c.id, c.name, c.provider));
        console.dir(conns.data || conns, { depth: 5 });
    } catch(e) {
        console.error('Error caught:');
        console.error(e.message);
    }
})();

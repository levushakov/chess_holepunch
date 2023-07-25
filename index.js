import Corestore from "corestore";
import Hyperswarm from "hyperswarm";
import RAM from "random-access-memory";

const seed = [...Array(32)]
  .map(() => (~~(Math.random() * 36)).toString(36))
  .join("");

console.log(seed);

//if you want to persist in file system
// const storePath = "store" + seed;
// const store = new Corestore(storePath);

//if you want to only use hypercore in memory
const store = new Corestore(RAM);

//when creating a core by name, it creates a writable core
const core = store.get({ name: seed, valueEncoding: "json" });
await core.ready();
console.log("My key ----->", core.key.toString("hex"));

//the hyperswarm key pair is the same key pair as for the hypercore
const swarm = new Hyperswarm({ keyPair: await store.createKeyPair(seed) });

const topic = Buffer.alloc(32).fill(
  "some random topic this will be a GAME ID later!"
);
swarm.join(topic);

swarm.on("connection", async (connection) => {
  console.log(
    "new connection from",
    connection.remotePublicKey.toString("hex")
  );

  const otherCore = store.get({ key: connection.remotePublicKey });
  await otherCore.ready();
  console.log("Other core key ----->", otherCore.key.toString("hex"));
  otherCore.createReadStream({ live: true }).on("data", function (data) {
    console.log("-->", data.toString());
  });
  store.replicate(connection);
});

process.stdin.on("data", function (msg) {
  core.append({
    timestamp: Date.now(),
    message: msg.toString().trim(),
  });
});

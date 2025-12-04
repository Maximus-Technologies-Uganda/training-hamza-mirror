import createServer from './src/blog/server.js';
const server = await createServer({logger:false, skipCors:true, skipHelmet:true, skipRequestContext:true});
await server.ready();
const createRes = await server.inject({method:'POST', url:'/posts', payload:{title:'Hello', body:'World'}});
console.log('create status', createRes.statusCode, createRes.body);
const created = JSON.parse(createRes.body);
const getRes = await server.inject({method:'GET', url:`/posts/${created.id}`});
console.log('get status', getRes.statusCode, getRes.body);
await server.close();

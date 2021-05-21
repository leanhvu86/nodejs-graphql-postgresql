import { ApolloServer } from 'apollo-server';
import jwt from 'express-jwt';

import { typeDefs } from './data/schema';
import { mocks } from './data/mocks';
import { resolvers } from './data/resolvers';
import { JWT_SECRET } from './config';
import { db,UserModel } from './data/connectors';
import {seed} from './data/seed';
import faker from 'faker';
import bcrypt from 'bcrypt';
const MESSAGE_CREATED = "Testmessage";
import { pubsub } from './data/subscriptions';
import Sequelize from 'sequelize';


process.env.TZ = 'Asia/Ho_Chi_Minh';
console.log(new Date().toLocaleString('en-US', {
  timeZone: 'Asia/Ho_Chi_Minh'
}));

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req, res, connection }) => {
    if (connection) {
      return {};
    }

    const user = new Promise((resolve, reject) => {
      //console.log(reject);
      jwt({
        secret: JWT_SECRET,
        credentialsRequired: false,
      })(req, res, e => {
        const token = req.headers.authorization || '';
        //console.log(req.user);
        if (req.user) {
          console.log("validate user");
          console.log(req.user.id);
          let user  = UserModel.findOne({ where: { id: req.user.id } })
          user.then(user => {
            console.log(user);
          })
          resolve(user);
        } else {
          resolve(null);
        }
      });
    });
    
    return {user};
    //return { reject };
  },
});

let port = process.env.PORT || 5000;
if (process.env.NODE_ENV === 'production') {
  port = process.env.PORT || 80;
}

server.listen(port).then(({ url, subscriptionsUrl }) => {
  console.log(`🚀 Apollo server ready on ${url}`);
  console.log(`🚀 Subscriptions ready at ${subscriptionsUrl}`);
});

// let id = 2;

// setInterval(() => {
//   pubsub.publish(MESSAGE_CREATED, {
//     messageTestCreated: { id, content: new Date().toString() },
//   });

//   id++;
// }, 100);

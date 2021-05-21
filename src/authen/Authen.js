import {AuthenticationError } from 'apollo-server';

export const getAuthenticatedUser = (ctx) =>  {
    // return UserModel.findOne({ where: { id: 1 } });
    return ctx.user.then(user => {
      if (!user) {
        throw new AuthenticationError('Unauthenticated');
      }
      return user;
    });
  }
import Sequelize from 'sequelize';
import GraphQLDate from 'graphql-date';
import {withFilter, ApolloError, AuthenticationError} from 'apollo-server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import faker from 'faker';
import {getAuthenticatedUser} from '../authen/Authen'
import {FileStatus } from '../data/enum/file_status.js'
import {VoucherStatus } from '../data/enum/file_status.js'

const fetch = require("node-fetch");

import {
    ChatModel,
    MessageModel,
    UserModel,
    GroupModel,
    db,
    ItemModel,
    ActionModel,
    FollowModel,
    CompanyModel,
    UniversityModel,
    HighSchoolModel,
    MajorModel,
    SkillModel,
    UserAwardModel,
    FileModel,
    VoucherModel,
} from './connectors';
import {pubsub} from './subscriptions';
import {JWT_SECRET} from '../config';
import {queryLogic, userLogic} from './logic';
import {sento} from '../fcm/pushFcm';
import moment from "moment";

// connectori su orm mapiranja, a resolveri su orm upiti mapiranja na graphql
// Group, Message, User sequelize modeli tabele
//
const MESSAGE_ADDED_TOPIC = 'messageAdded';
const GROUP_ADDED_TOPIC = 'groupAdded';
const MESSAGE_IN_GROUP_ADDED_TOPIC = 'messageInGroupAdded';
const MESSAGE_CREATED = "Testmessage";
const PNG  = "png"
const JPG  = "jpg"
const JPEG  = "jpeg"
const MP3  = "mp3"
const MP4  = "mp4"
const DOC  = "doc"
const DOCX  = "docx"



const Op = Sequelize.Op;
const riotUrl = 'http://demo.nextsolutions.com.vn:3001/riot';

const mstoreUrl = 'http://demo.nextsolutions.com.vn:3001/mstore';


async function postData(url = '', data = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
}

async function getData(url = '', data = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit

        headers: {
            'Content-Type': 'application/json',
            "Authorization": "Bearer 7d44a6dd-7627-463d-be93-a387898ba67f",
            "Accept-Language" : "1"
        }
    });
    return response.json(); // parses JSON response into native JavaScript objects
}



export const resolvers = {
    Date: GraphQLDate,

    Subscription: {
        messageAdded: {
            subscribe: withFilter(
                () => pubsub.asyncIterator(MESSAGE_ADDED_TOPIC),
                async (payload, args) => {
                    const group = await GroupModel.findOne({
                        where: {id: args.groupId},
                    });
                    const chat = await group.getChat();
                    return Boolean(chat.id === payload.messageAdded.chatId);
                },
            ),
        },
        groupAdded: {
            subscribe: withFilter(
                () => pubsub.asyncIterator(GROUP_ADDED_TOPIC),
                (payload, args) => {
                    // console.log(JSON.stringify(payload, null, 2));
                    return Boolean(true /*args.userId === payload.groupAdded.userId*/);
                },
            ),
        },
        messageInGroupAdded: {
            subscribe: withFilter(
                () => pubsub.asyncIterator(MESSAGE_IN_GROUP_ADDED_TOPIC),
                (payload, args) => {
                    console.log(JSON.stringify(payload, null, 2));
                    return Boolean(
                        true /*args.userId === payload.defaultGroupAdded.userId*/,
                    );
                },
            ),
        },
        messageTestCreated: {
            subscribe: withFilter(() => pubsub.asyncIterator(MESSAGE_CREATED),
                (payload, args) => {
                    // console.log(JSON.stringify(payload, null, 2));
                    // console.log(args.id);
                    // console.log(payload.messageTestCreated.id / args.id);
                    return Boolean(
                        payload.messageTestCreated.id % args.id === 0
                    );
                }
            )
        },
    },

    Mutation: {
        async createFile(_, {file, user_id}, ctx) {
            // const auUser = await getAuthenticatedUser(ctx);
            const owner = await UserModel.findOne({where: {id: user_id}});
            let file_url = file.file_url;
            // cut string of url and get file type . eg 'png,mp3'
            let lastIndexOfDot = file_url.lastIndexOf(".");
            var file_type = file_url.substring(lastIndexOfDot + 1);
            const _file = await FileModel.create({
                file_name: file.file_name,
                status: FileStatus.ACTIVE,
                file_type: file_type,
                owner_id: owner.id,
                file_url: file_url,
                createdAt: new Date().toLocaleString('en-US', {
                    timeZone: 'Asia/Ho_Chi_Minh'
                })
            });

            // pubsub.publish(GROUP_ADDED_TOPIC, { [GROUP_ADDED_TOPIC]: _group });
            return _file;
        },
        async createFiles(_, {files, user_id}, ctx) {

            // const auUser = await getAuthenticatedUser(ctx);
            const owner = await UserModel.findOne({where: {id: user_id}})
            if (owner) {
                console.log(owner.id)
                if (files.length > 0) {
                    let file;
                    for (file in files) {
                        let file_url = files[file].file_url;
                        // cut string of url and get file type . eg 'png,mp3'
                        let lastIndexOfDot = files[file].file_url.lastIndexOf(".");
                        let file_type = files[file].file_url.substring(lastIndexOfDot + 1);
                        if (file_type === PNG || file_type === JPG || file_type === JPEG || file_type === MP3
                            || file_type === MP4 || file_type === DOC || file_type === DOCX) {
                            files[file] = {
                                file_name: files[file].file_name,
                                status: FileStatus.ACTIVE,
                                file_type: file_type,
                                owner_id: owner.id,
                                file_url: file_url,
                                createdAt: new Date().toLocaleString('en-US', {
                                    timeZone: 'Asia/Ho_Chi_Minh'
                                })
                            }
                        } else {
                            return Promise.reject('File wrong format');
                        }

                    }
                    const _files = await FileModel.bulkCreate(files, {validate: true});
                    return _files;
                }

                return Promise.reject('file paramater null');
            }
            return Promise.reject('User not found');
        },

        async updateFile(_, {id, file_url, file_name, user_id}, ctx) {
            const owner = await UserModel.findOne({where: {id: user_id}});
            if (owner) {
                const file = await FileModel.findOne({where: {id}});
                if (file) {
                    if (file.owner_id != owner.id) {
                        return Promise.reject('User does not have permission');
                    }
                    if (file_name) {
                        file.file_name = file_name
                    }
                    if (file_url) {
                        let lastIndexOfDos = file_url.lastIndexOf(".");
                        var file_type = file_url.substring(lastIndexOfDos + 1);
                        if (file_type === PNG || file_type === JPG || file_type === JPEG || file_type === MP3
                            || file_type === MP4 || file_type === DOC || file_type === DOCX) {
                            file.file_url = file_url
                            file.file_type = file_type
                        } else {
                            return Promise.reject('File wrong format');
                        }
                    }
                    file.updatedAt = new Date().toLocaleString('en-US', {
                        timeZone: 'Asia/Ho_Chi_Minh'
                    })

                    await file.save();
                    return file;
                } else {
                    return Promise.reject('File not found');
                }
            } else {
                return Promise.reject('User not found');
            }


        },
        async deleteFile(_, {id, user_id}, ctx) {
            const owner = await UserModel.findOne({where: {id: user_id}});
            if (!owner) {
                return Promise.reject('Delete failed, User does not exist');
            }

            const file = await FileModel.findOne({
                where: {
                    [Op.and]: [
                        {id: {[Op.eq]: id}},
                        {status: {[Op.eq]: 1}}
                    ]
                },
            });
            if (file) {
                if (file.owner_id == user_id) {
                    file.status = FileStatus.DELETED;
                    file.updatedAt = new Date().toLocaleString('en-US', {
                        timeZone: 'Asia/Ho_Chi_Minh'
                    })
                } else {
                    return Promise.reject('Delete failed, User does not have permission');
                }

            }
            else{
                return Promise.reject('File not found with id : '+ id);
            }
            await file.save();
            return file;
        },
        async deleteFiles(_, {ids, user_id}, ctx) {
            let files = []
            const owner = await UserModel.findOne({where: {id: user_id}});
            if (!owner) {
                return Promise.reject('Delete failed, User does not exist')
            }
            let id;
            for(id in ids){
                let fileReturn;
                const file = await FileModel.findOne({
                    where: {
                        [Op.and]: [
                            {id: {[Op.eq]: ids[id]}},
                            {status: {[Op.eq]: 1}}
                        ]
                    },
                });
                if (file) {
                    if (file.owner_id == user_id) {
                        fileReturn = file
                        file.status = FileStatus.DELETED;
                        file.updatedAt = new Date().toLocaleString('en-US', {
                            timeZone: 'Asia/Ho_Chi_Minh'
                        });
                    } else {
                        return Promise.reject('Delete failed, User does not have permission');
                    }

                }
                else{
                    return Promise.reject('File not found with id : '+ ids[id]);
                }
                await file.save();
            }
            return "success";

        },
        async createVouchers(_, {vouchers}, ctx){
            console.log(vouchers)
            let voucherArray = []
            if (vouchers.length == 0){
                return Promise.reject('Vouchers can not null');
            }
            let  i;
            for (i in vouchers){
                console.log(`tao in ra i nhe; `, vouchers[i].incentive_name)
                console.log('Vao trong for',voucher[i].incentive_name)
                let voucher = {
                    code:vouchers[i].code,
                    app_name:"Thuong mai dien tu Mstore",
                    app_code:"ABC",
                    program_name:"Chuong trinh trung bay",
                    status:VoucherStatus.ACTIVE,
                    required_minimum_amount:vouchers[i].required_minimum_amount,
                    limited_quantity:vouchers[i].limited_quantity,
                    discount_percent:vouchers[i].discount_percent,
                    incentive_name:voucher[i].incentive_name,
                    from_date:vouchers[i].from_date,
                    to_date:vouchers[i].to_date,
                    parking_code:vouchers[i].parking_code,
                    quantity: voucher[i].quantity,
                    discount_price:voucher[i].discount_price,
                    short_description:vouchers[i].short_description
                }
                console.log('Lan 1')
                voucherArray.push(voucher)
            }
            console.log('May be die here')
            const _vouchers = await VoucherModel.bulkCreate(voucherArray, {validate: true});
            return "success";
        },
        async updateVoucher(_, {voucher}, ctx){
            let fVoucher =  await VoucherModel.findOne({
                where: {code: code},
            });
            if(fVoucher){
                fVoucher.required_minimum_amount = voucher.required_minimum_amount;
                fVoucher.limited_quantity= voucher.limited_quantity;
                fVoucher.discount_percent = voucher.discount_percent;
                fVoucher.incentive_name= voucher.incentive_name;
                fVoucher.from_date= voucher.from_date;
                fVoucher.to_date = voucher.to_date;
                fVoucher.parking_code = voucher.parking_code;
                fVoucher.quantity = voucher.quantity;
                fVoucher.discount_price= voucher.discount_price;
                await fVoucher.save();
                return fVoucher;

            }else{
                return Promise.reject('Voucher not found with code : '+ voucher.code);
            }

        },
        async findVoucherByCode(code){
            const voucher = await VoucherModel.findOne({
                where: {code: code},
            });
            return voucher

        },
        async addFriend(_, {userId, friendId}, ctx) {
            const user = await UserModel.findOne({
                where: {id: userId},
            });
            const friendAlreadyExists = await user.getFriends({
                where: {id: friendId},
            });
            if (friendAlreadyExists.length > 0)
                throw new ApolloError('user with that friendId is already friend', 404);

            const friend = await UserModel.findOne({
                where: {id: friendId},
            });
            await user.addFriend(friend);
            return user;
        },
        async singleUpload(_, args, ctx) {
            console.log(args)
            return true;
        },
        async removeFriend(_, {userId, friendId}, ctx) {
            const user = await UserModel.findOne({
                where: {id: userId},
            });
            const friendAlreadyExists = await user.getFriends({
                where: {id: friendId},
            });
            if (friendAlreadyExists.length === 0)
                throw new ApolloError('user with that friendId is not friend', 404);

            const friend = await UserModel.findOne({
                where: {id: friendId},
            });
            await user.removeFriend(friend);
            return user;
        },
        async addUserToGroup(_, {groupId, userId}, ctx) {
            const group = await GroupModel.findOne({
                where: {id: groupId},
            });
            const user = await UserModel.findOne({
                where: {id: userId},
            });
            const chat = await group.getChat();
            await user.addChat(chat);
            await user.addGroup(group);
            return user;
        },
        async addPost(_, {user_id, message, url, description, type, isPrivate, string_font, string_color}, ctx) {
            let tempurl = "";
            if (url) {
                tempurl = url.join(",");
            }

            const item = await ItemModel.create({
                user_id: user_id,
                message: message,
                url: tempurl,
                description: description,
                createdAt: new Date().toLocaleString('en-US', {
                    timeZone: 'Asia/Ho_Chi_Minh'
                }),
                created_at: new Date().toLocaleString('en-US', {
                    timeZone: 'Asia/Ho_Chi_Minh'
                }),
                type: type,
                string_font: string_font,
                string_color: string_color,
            })

            //add action
            const action = await ActionModel.create({
                actor_id: user_id,
                verb: "newsfeed",
                target_id: item.id,
                description: "create post",
                createdAt: new Date().toLocaleString('en-US', {
                    timeZone: 'Asia/Ho_Chi_Minh'
                }),
                created_at: new Date().toLocaleString('en-US', {
                    timeZone: 'Asia/Ho_Chi_Minh'
                }),
                isPrivate: isPrivate,
                is_active: true,
            })
            if (!item.url) {
                item.url = [""];
            } else {
                item.url = item.url.split(",");
            }
            return item;
        },
        async updatePost(_, {itemId, message, url, description, type, isPrivate, string_font, string_color}, ctx) {
            let tempurl = "";
            if (url) {
                tempurl = url.join(",");
            }
            const item = await ItemModel.findOne({
                where: {id: itemId},
            });
            if (item) {
                if (message) item.message = message;
                if (url) item.url = tempurl;
                if (description) item.description = description;
                item.updatedAt = new Date().toLocaleString('en-US', {
                    timeZone: 'Asia/Ho_Chi_Minh'
                });
                if (type) item.type = type;
                if (isPrivate) item.isPrivate = isPrivate;
                if (string_font) item.string_font = string_font;
                if (string_color) item.string_color = string_color;
            }

            const action = await ActionModel.findOne({
                where: {
                    [Op.and]: [
                        {target_id: {[Op.eq]: itemId}},
                        {verb: {[Op.eq]: "newsfeed"}},
                    ]
                },
            });
            if (action) {
                action.isPrivate = isPrivate;
            }
            await action.save();
            await item.save();
            if (!item.url) {
                item.url = [""];
            } else {
                item.url = item.url.split(",");
            }
            return item;
        },
        async deletePost(_, {itemId}, ctx) {
            const action = await ActionModel.findOne({
                where: {
                    [Op.and]: [
                        {target_id: {[Op.eq]: itemId}},
                        {verb: {[Op.eq]: "newsfeed"}},
                    ]
                },
            });
            if (action) {
                action.is_active = false;
            }
            await action.save();
            return Promise.reject('Success');
        },
        // addComment(user_id: Int!, target_item_id: Int!, message: String!, url: String, type: Int): Item
        // addLike(user_id: Int!, target_item_id: Int!): Item
        async addComment(_, {user_id, target_item_id, message, url, type, string_font, string_color}, ctx) {
            const auUser = await getAuthenticatedUser(ctx);

            let tempurl = "";
            if (url) {
                tempurl = url.join(",");
            }

            const user = await UserModel.findOne({where: {id: user_id}});
            if (user) {
                //no thing
            } else {
                throw new ApolloError('user is not exist', 404);
            }

            const item = await ItemModel.create({
                user_id: user_id,
                message: message,
                url: tempurl,
                createdAt: new Date().toLocaleString('en-US', {
                    timeZone: 'Asia/Ho_Chi_Minh'
                }),
                type: type,
                string_font: string_font,
                string_color: string_color,
            })

            //add action
            const action = await ActionModel.create({
                actor_id: user_id,
                verb: "comment",
                target_id: target_item_id,
                target_value_id: item.id,
                description: "create comment",
                createdAt: new Date().toLocaleString('en-US', {
                    timeZone: 'Asia/Ho_Chi_Minh'
                }),
                isPrivate: true,
                is_active: true,
            })
            if (!item.url) {
                item.url = [""];
            } else {
                item.url = item.url.split(",");
            }
            item.user_avatar_url = user.avatar;
            item.username = user.username;

            //notification
            const itemNoti = await ItemModel.findOne({
                where:
                    {id: target_item_id},
            });
            const userNoti = await UserModel.findOne({
                where:
                    {id: itemNoti.user_id},
            });
            if (user) {
                console.log(auUser.id, userNoti.id);
                if (auUser && auUser.id !== userNoti.id) {
                    console.log(auUser.id, userNoti.id);
                    itemNoti.username = auUser.username;
                    itemNoti.createAt = action.createAt;
                    sento(userNoti.fcm_device_token, itemNoti, ' vừa trả lời bài viết của bạn ');
                }
            }

            return item;
        },

        async updateComment(_, {itemId, message, url, description, type, string_font, string_color}, ctx) {
            let tempurl = "";
            if (url) {
                tempurl = url.join(",");
            }
            const item = await ItemModel.findOne({
                where: {id: itemId},
            });
            if (item) {
                if (message) item.message = message;
                if (url) item.url = tempurl;
                if (description) item.description = description;
                item.updatedAt = new Date().toLocaleString('en-US', {
                    timeZone: 'Asia/Ho_Chi_Minh'
                });
                if (type) item.type = type;
                if (string_font) item.string_font = string_font;
                if (string_color) item.string_color = string_color;
            }
            await item.save();
            if (!item.url) {
                item.url = [""];
            } else {
                item.url = item.url.split(",");
            }
            return item;
        },

        async deleteComment(_, {itemId}, ctx) {
            const action = await ActionModel.findOne({
                where: {
                    [Op.and]: [
                        {target_value_id: {[Op.eq]: itemId}},
                        {verb: {[Op.eq]: "comment"}},
                    ]
                },
            });
            if (action) {
                action.is_active = false;
            }
            await action.save();
            return "Delete Comment OK ";
        },

        async addLike(_, {user_id, target_item_id}, ctx) {
            //add action
            const auUser = await getAuthenticatedUser(ctx);

            const aupdate = await ActionModel.findOne({
                where: {
                    [Op.and]: [
                        {actor_id: {[Op.eq]: user_id}},
                        {target_id: {[Op.eq]: target_item_id}},
                        {verb: {[Op.eq]: "like"}},
                    ]
                },
            });
            if (aupdate) {
                aupdate.is_active = true;
                await aupdate.save();
                return 'OK';
            }

            const action = await ActionModel.create({
                actor_id: user_id,
                verb: "like",
                target_id: target_item_id,
                target_value_id: target_item_id,
                description: "create like",
                createdAt: new Date().toLocaleString('en-US', {
                    timeZone: 'Asia/Ho_Chi_Minh'
                }),
                isPrivate: true,
                is_active: true,
            })
            const item = await ItemModel.findOne({
                where:
                    {id: target_item_id},
            });
            const user = await UserModel.findOne({
                where:
                    {id: item.user_id},
            });
            if (user) {

                if (auUser && auUser.id !== user.id) {
                    console.log(auUser.id, user.id);
                    item.username = auUser.username;
                    item.createAt = action.createAt;
                    sento(user.fcm_device_token, item, ' vừa thích bài viết của bạn ');
                }
            }
            return "Like_ok";
        },
        async addFollow(_, {userId, target_userId}, ctx) {
            //add action

            const follow = await FollowModel.findOne({
                where: {
                    [Op.and]: [
                        {actor_id: {[Op.eq]: userId}},
                        {follow_user_id: {[Op.eq]: target_userId}},
                    ]
                },
            });

            if (follow) {
                follow.is_active = true;
                await follow.save();
            } else {
                const f = await FollowModel.create({
                    actor_id: userId,
                    follow_user_id: target_userId,
                    createdAt: new Date().toLocaleString('en-US', {
                        timeZone: 'Asia/Ho_Chi_Minh'
                    }),
                    is_active: true,
                })
            }
            return "OK";
        },
        async disFollow(_, {userId, target_userId}, ctx) {
            //add action
            const follow = await FollowModel.findOne({
                where: {
                    [Op.and]: [
                        {actor_id: {[Op.eq]: userId}},
                        {follow_user_id: {[Op.eq]: target_userId}},
                    ]
                },
            });

            if (follow) {
                follow.is_active = false;
                await follow.save();
            } else {
                return Promise.reject('Error imput value ');
            }

            return "OK";
        },
        async disLike(_, {user_id, target_item_id}, ctx) {
            const action = await ActionModel.findOne({
                where: {
                    [Op.and]: [
                        {actor_id: {[Op.eq]: user_id}},
                        {target_id: {[Op.eq]: target_item_id}},
                        {verb: {[Op.eq]: "like"}},
                    ]
                },
            });
            if (action) {
                action.is_active = false;
                await action.save();
            } else {
                return Promise.reject('Error imput value ');
            }
            return "dis like ok ";
        },

        async removeUserFromGroup(_, {groupId, userId}, ctx) {
            //move to logic
            const group = await GroupModel.findOne({
                where: {id: groupId},
            });
            if (group.ownerId === userId)
                throw new ApolloError('owner can delete but not leave group', 404);

            const users = await group.getUsers();
            const isInTheUsers = users.map(user => user.id).includes(userId);

            if (!isInTheUsers) throw new ApolloError('user is not in the group', 404);

            const user = await UserModel.findOne({
                where: {id: userId},
            });
            const chat = await group.getChat();
            await user.removeChat(chat);
            await user.removeGroup(group);
            return user;
        },
        async createDefaultGroup(_, {userId, contactId}, ctx) {
            //alredy in default group
            const existingDefaultGroup = await db.query(
                `(SELECT g.id FROM groups g, users u, "GroupUser" gu
          where g.id = gu."groupId" and u.id = gu."userId" 
          and g.name = 'default' and u.id = :userId)
          intersect
          (SELECT g.id FROM groups g, users u, "GroupUser" gu
          where g.id = gu."groupId" and u.id = gu."userId" 
          and g.name = 'default' and u.id = :contactId)`,
                {
                    replacements: {userId: userId, contactId: contactId},
                    type: Sequelize.QueryTypes.SELECT,
                },
            );

            if (existingDefaultGroup.length > 0) {
                return GroupModel.findOne({
                    where: {id: existingDefaultGroup[0].id},
                });
            }

            //create chat
            const chat = await ChatModel.create({});
            const user = await UserModel.findOne({where: {id: userId}});
            const contact = await UserModel.findOne({where: {id: contactId}});
            await user.addChat(chat);
            await contact.addChat(chat);
            // create group
            const group = await GroupModel.create({name: 'default'});
            await chat.setGroup(group);
            await user.addGroup(group);
            await contact.addGroup(group); //
            return group;
        },
        async login(_, {username, password, type}, ctx) {
            console.log("--------------------------------------");
            if (type) {
                if (type === 'mingalaba') {
                    return postData(riotUrl, {
                        username: username,
                        password: 'none',
                        token: password
                    })
                        .then(data => {
                            console.log(data);
                            let username = data.username.substring(1, data.username.indexOf(":"));
                            console.log("username == ", username);
                            return UserModel.findOne({where: {username: username}}).then(user => {
                                if (user) {
                                    user.avatar = data.avatar;
                                    user.display_name = data.display_name;
                                    return user.save().then(user => {
                                        const token = jwt.sign(
                                            {
                                                id: user.id,
                                                username: username,
                                            },
                                            JWT_SECRET,
                                        );
                                        user.jwt = token;
                                        ctx.user = Promise.resolve(user);
                                        return user;
                                    });
                                } else {
                                    return UserModel.create({
                                        email: data.username,
                                        password: null,
                                        username: username,
                                        avatar: data.avatar,
                                        display_name: data.display_name,
                                        description: null,
                                        app: "mingalaba",
                                    }).then((user) => {
                                        console.log('user create ')
                                        const token = jwt.sign(
                                            {
                                                id: user.id,
                                                username: user.username,
                                            },
                                            JWT_SECRET,
                                        );
                                        user.jwt = token;
                                        ctx.user = Promise.resolve(user);
                                        return user;
                                    })
                                }
                            }, error => {
                                console.log(error);
                            });
                        });
                }

                if (type === 'mstore') {
                    let data = await postData(mstoreUrl, {
                        username: username,
                        password: password,
                    });
                    if (data) {
                        const user = await UserModel.findOne({where: {username: data.username}});
                        console.log(user);
                        if (user) {
                            user.avatar = data.avatar;
                            user.display_name = data.display_name;
                            const u = await user.save();

                            const token = jwt.sign(
                                {
                                    id: user.id,
                                    username: user.username,
                                },
                                JWT_SECRET,
                            );
                            u.jwt = token;
                            ctx.user = Promise.resolve(u);
                            console.log(user);
                            return u;

                        } else {

                            let user = UserModel.create({
                                email: data.username,
                                password: null,
                                username: data.username,
                                avatar: data.avatar,
                                display_name: data.display_name,
                                description: null,
                                app: "mstore",
                            });

                            const token = jwt.sign(
                                {
                                    id: user.id,
                                    username: user.username,
                                },
                                JWT_SECRET,
                            );
                            user.jwt = token;
                            ctx.user = Promise.resolve(user);
                            console.log(user);
                            return user;

                        }
                    }


                }
            } else {
                return UserModel.findOne({where: {username}}).then(user => {
                    if (user) {
                        return bcrypt.compare(password, user.password).then(res => {
                            if (res) {
                                const token = jwt.sign(
                                    {
                                        id: user.id,
                                        username: user.username,
                                    },
                                    JWT_SECRET,
                                );
                                user.jwt = token;
                                ctx.user = Promise.resolve(user);
                                return user;
                            }
                            //throw new ApolloError('password incorrect');
                            return Promise.reject('password incorrect');
                        });
                    }
                    //throw new ApolloError('email not found');
                    return Promise.reject('username not found');
                });

            }
            return Promise.reject('username not found');
        },
        register(_, {email, password, username}, ctx) {
            return UserModel.findOne({where: {username}}).then(existing => {
                if (!existing) {
                    return bcrypt
                        .hash(password, 10)
                        .then(hash =>
                            UserModel.create({
                                email,
                                password: hash,
                                username,
                                avatar: faker.internet.avatar(),
                                description: faker.lorem.sentences(3),
                            }),
                        )
                        .then(user => {
                            const {id} = user;
                            const token = jwt.sign({id, username}, JWT_SECRET);
                            user.jwt = token;
                            console.log('================> ko register');
                            ctx.user = Promise.resolve(user);
                            const s = getAuthenticatedUser(ctx);
                            console.log('aaaa', s.id);
                            return user;
                        });
                }
                return Promise.reject('username already exists'); // email already exists
            });
        },
        //createUser(username: String!, email: String, password: String!, avatar_url: String): User
        createUser(_, {email, password, username, avatar_url}, ctx) {
            return UserModel.findOne({where: {username}}).then(existing => {
                if (!existing) {
                    return bcrypt
                        .hash(password, 10)
                        .then(hash =>
                            UserModel.create({
                                email,
                                password: hash,
                                username,
                                avatar: avatar_url,
                                description: faker.lorem.sentences(3),
                            }),
                        )
                        .then(user => {
                            return user;
                        });
                }
                return Promise.reject('username already exists'); // email already exists
            });
        },
        async createCompany(_, {name, address, job_title, job_position, from_time, to_time, status, private_check, user_id}, ctx) {
            // const auUser = await getAuthenticatedUser(ctx);
            return CompanyModel.findOne({where: {name, user_id, from_time}}).then(existing => {
                if (!existing) {
                    return CompanyModel.create({
                        name,
                        address,
                        job_title,
                        job_position,
                        from_time,
                        to_time,
                        status,
                        private_check,
                        user_id,
                        description: faker.lorem.sentences(3),
                        is_active: true
                    });
                } else {
                    return Promise.reject('company already exists'); // email already exists
                }
            });
        },
        async updateCompany(_, {id, name, address, job_title, job_position, from_time, to_time, status, private_check, is_active, user_id}, ctx) {
            // const auUser = await getAuthenticatedUser(ctx);
            const company = await CompanyModel.findOne({where: {id: id}});
            if (company) {
                console.log(company)
                if (name) {
                    company.name = name
                }
                if (address) {
                    company.address = address
                }
                if (job_title) {
                    company.job_title = job_title
                }
                if (job_position) {
                    company.job_position = job_position
                }
                if (from_time) {
                    company.from_time = from_time
                }
                if (to_time) {
                    company.to_time = to_time
                }
                if (status) {
                    company.status = status
                }
                if (private_check) {
                    company.private_check = private_check
                }
                if (is_active) {
                    company.is_active = is_active
                }
                console.log(company)
                await company.save();
                return company;
            } else {
                return Promise.reject('company not found'); // email already exists
            }
        },
        async deleteCompany(_, {id, user_id}, ctx) {
            const auUser = await getAuthenticatedUser(ctx);
            const company = await CompanyModel.findOne({where: {id: id}});
            if (company) {
                company.is_active = false;
                await company.save();
                return company;
            } else {
                return Promise.reject('company not found'); // email already exists
            }
        },
        async createUniversity(_, {name, first_major, second_major, third_major, from_time, to_time, graduated, private_check, user_id}, ctx) {
            // const auUser = await getAuthenticatedUser(ctx);
            return UniversityModel.findOne({where: {name, user_id, from_time, first_major}}).then(existing => {
                if (!existing) {
                    let first_mj = '';
                    let second_mj = '';
                    let third_mj = '';
                    if (first_major !== undefined && first_major !== '') {
                        first_mj = first_major
                    }
                    if (second_major !== undefined && second_major !== '') {
                        second_mj = second_major
                    }
                    if (third_major !== undefined && third_major !== '') {
                        third_mj = third_major
                    }
                    return UniversityModel.create({
                        name,
                        first_major: first_mj,
                        second_major: second_mj,
                        third_major: third_mj,
                        from_time,
                        to_time,
                        graduated,
                        private_check,
                        user_id,
                        description: faker.lorem.sentences(3),
                        is_active: true
                    });
                } else {
                    return Promise.reject('university already exists'); // email already exists
                }
            });
        },
        async updateUniversity(_, {id, name, first_major, second_major, third_major, from_time, to_time, graduated, private_check, is_active, user_id}, ctx) {
            // const auUser = await getAuthenticatedUser(ctx);
            const university = await UniversityModel.findOne({where: {id}});
            if (university) {
                if (name !== undefined && name !== '') {
                    university.name = name
                }
                if (first_major) {
                    university.first_major = first_major
                }

                if (second_major) {
                    university.second_major = second_major
                }
                if (third_major) {
                    university.third_major = third_major
                }
                if (from_time) {
                    university.from_time = from_time
                }
                if (to_time) {
                    university.to_time = to_time
                }
                if (graduated) {
                    university.graduated = graduated
                }
                if (private_check) {
                    university.private_check = private_check
                }
                if (is_active) {
                    university.is_active = is_active
                }
                await university.save();
                return university;
            } else {
                return Promise.reject('university not found'); // email already exists
            }

        },
        async deleteUniversity(_, {id, user_id}, ctx) {
            // const auUser = await getAuthenticatedUser(ctx);
            const university = await UniversityModel.findOne({where: {id: id}});
            if (university) {
                university.is_active = false;
                await university.save();
                return university;
            } else {
                return Promise.reject('university not found'); // email already exists
            }
        },
        async createHighSchool(_, {name, from_time, to_time, graduated, private_check, user_id}, ctx) {
            return HighSchoolModel.findOne({where: {name, user_id, from_time}}).then(existing => {
                if (!existing) {
                    return HighSchoolModel.create({
                        name,
                        from_time,
                        to_time,
                        graduated,
                        private_check,
                        user_id,
                        description: faker.lorem.sentences(3),
                        is_active: true
                    });
                } else {
                    return Promise.reject('high school already exists'); // email already exists
                }
            });
        },
        async updateHighSchool(_, {id, name, from_time, to_time, graduated, private_check, is_active, user_id}, ctx) {
            // const auUser = await getAuthenticatedUser(ctx);
            const highSchool = await HighSchoolModel.findOne({where: {id}});
            if (highSchool) {
                if (name) {
                    highSchool.name = name
                }
                if (from_time) {
                    highSchool.from_time = from_time
                }
                if (to_time) {
                    highSchool.to_time = to_time
                }
                if (graduated) {
                    highSchool.graduated = graduated
                }
                if (private_check) {
                    highSchool.private_check = private_check
                }
                if (is_active) {
                    highSchool.is_active = is_active
                }
                await highSchool.save();
                return highSchool;
            } else {
                return Promise.reject('highSchool not found'); // email already exists
            }

        },
        async deleteHighSchool(_, {id, user_id}, ctx) {
            // const auUser = await getAuthenticatedUser(ctx);
            const highSchool = await HighSchoolModel.findOne({where: {id: id}});
            if (highSchool) {
                highSchool.is_active = false;
                await highSchool.save();
                return highSchool;
            } else {
                return Promise.reject('highSchool not found'); // email already exists
            }
        },
        async createSkill(_, {name, detail, level, private_check, user_id}, ctx) {
            return SkillModel.findOne({where: {name, user_id, detail}}).then(existing => {
                if (!existing) {
                    return SkillModel.create({
                        name,
                        user_id,
                        detail,
                        level,
                        private_check,
                        description: faker.lorem.sentences(3),
                        is_active: true
                    });
                } else {
                    return Promise.reject('skill already exists'); // email already exists
                }
            });
        },
        async updateSkill(_, {id, name, detail, level, private_check, user_id, is_active}, ctx) {
            // const auUser = await getAuthenticatedUser(ctx);
            const skill = await SkillModel.findOne({where: {id}});
            if (skill) {
                if (name) {
                    skill.name = name
                }
                if (detail) {
                    skill.detail = detail
                }
                if (level) {
                    skill.level = level
                }
                if (is_active) {
                    skill.is_active = is_active
                }
                await skill.save();
                return skill;
            } else {
                return Promise.reject('skill not found'); // email already exists
            }
        },
        async deleteSkill(_, {id, user_id}, ctx) {
            // const auUser = await getAuthenticatedUser(ctx);
            const skill = await SkillModel.findOne({where: {id: id}});
            if (skill) {
                skill.is_active = false;
                await skill.save();
                return skill;
            } else {
                return Promise.reject('skill not found'); // email already exists
            }
        },
        async createUserAward(_, {name, detail, attachment, private_check, user_id}, ctx) {
            return UserAwardModel.findOne({where: {name, user_id, detail}}).then(existing => {
                if (!existing) {
                    return UserAwardModel.create({
                        name,
                        user_id,
                        detail,
                        attachment,
                        private_check,
                        description: faker.lorem.sentences(3),
                        is_active: true
                    });
                } else {
                    return Promise.reject('user Award already exists'); // email already exists
                }
            });
        },
        async updateUserAward(_, {id, name, detail, attachment, private_check, user_id, is_active}, ctx) {
            // const auUser = await getAuthenticatedUser(ctx);
            const userAward = await UserAwardModel.findOne({where: {id, user_id}});
            if (userAward) {
                if (name) {
                    userAward.name = name
                }
                if (detail) {
                    userAward.detail = detail
                }
                if (attachment) {
                    userAward.attachment = attachment
                }
                if (is_active) {
                    userAward.is_active = is_active
                }
                if (private_check) {
                    userAward.private_check = private_check
                }
                await userAward.save();
                return userAward;
            } else {
                return Promise.reject('user Award not found'); // email already exists
            }
        },
        async deleteUserAward(_, {id, user_id}, ctx) {
            // const auUser = await getAuthenticatedUser(ctx);
            const userAward = await UserAwardModel.findOne({where: {id: id}});
            if (userAward) {
                userAward.is_active = false;
                await userAward.save();
                return userAward;
            } else {
                return Promise.reject('user award not found'); // email already exists
            }
        },
        async createMajor(_, {en_name, vi_name, my_name, code}, ctx) {
            // const auUser = await getAuthenticatedUser(ctx);
            return MajorModel.findOne({where: {en_name, code}}).then(existing => {
                if (!existing) {
                    return MajorModel.create({
                        en_name,
                        vi_name,
                        my_name,
                        code,
                        description: faker.lorem.sentences(3),
                        is_active: true
                    });
                } else {
                    return Promise.reject('high school already exists'); // email already exists
                }
            });
        },
        async updateMajor(_, {id, en_name, vi_name, my_name, code, is_active}, ctx) {

            const major = await MajorModel.findOne({where: {id}});
            if (major) {
                if (en_name) {
                    major.en_name = en_name
                }
                if (vi_name) {
                    major.vi_name = vi_name
                }
                if (my_name) {
                    major.my_name = my_name
                }
                if (code) {
                    major.code = code
                }
                if (is_active) {
                    major.is_active = is_active
                }
                await major.save();
                return major;
            } else {
                return Promise.reject('major not found'); // email already exists
            }

        },
        async deleteMajor(_, {id}, ctx) {
            // const auUser = await getAuthenticatedUser(ctx);
            const major = await MajorModel.findOne({where: {id: id}});
            if (major) {
                major.is_active = false;
                await major.save();
                return major;
            } else {
                return Promise.reject('major not found'); // email already exists
            }
        },
        async updateUser(_, {email, display_name, password, avatar_url, banner_url, first_name, last_name, birthday, username, fcm_device_token}, ctx) {
            const user = await UserModel.findOne({where: {username}});
            if (user) {
                if (email) {
                    user.email = email
                }
                if (password) {
                    const hash = await bcrypt.hash(password, 10);
                    user.password = hash;
                }
                if (avatar_url) {
                    user.avatar = avatar_url
                }
                if (banner_url) {
                    user.banner_url = banner_url
                }
                if (first_name) {
                    user.first_name = first_name
                }
                if (last_name) {
                    user.last_name = last_name
                }
                if (birthday) {
                    user.birthday = birthday
                }
                if (display_name) {
                    user.display_name = display_name
                }
                if (fcm_device_token) {
                    user.fcm_device_token = fcm_device_token
                }
                await user.save();
                return user;
            }
            return Promise.reject('username not ok'); // email already exists

        },
        async createMessage(_, {userId, groupId, text}) {
            //treba default group id mesto chat id
            const group = await GroupModel.findOne({where: {id: groupId}});
            const chat = await group.getChat();
            const message = await MessageModel.create({
                userId,
                chatId: chat.id,
                text,
            });
            pubsub.publish(MESSAGE_IN_GROUP_ADDED_TOPIC, {
                [MESSAGE_IN_GROUP_ADDED_TOPIC]: group,
            });
            pubsub.publish(MESSAGE_ADDED_TOPIC, {[MESSAGE_ADDED_TOPIC]: message});
            return message;
        },
        async createGroup(_, {group}) {
            const owner = await UserModel.findOne({where: {id: group.ownerId}});
            const chat = await ChatModel.create({});
            const _group = await GroupModel.create({
                name: group.name,
                avatar: group.avatarUrl,
                description: group.description,
                isPrivate: group.isPrivate,
            });

            await owner.addGroup(_group);
            await _group.setOwner(owner);
            await _group.addUser(owner);
            await chat.addUser(owner);
            await chat.setGroup(_group);

            pubsub.publish(GROUP_ADDED_TOPIC, {[GROUP_ADDED_TOPIC]: _group});
            return _group;
        },
        async editGroup(_, {group, groupId}) {
            const _group = await GroupModel.findOne({
                where: {id: groupId},
            });

            _group.name = group.name;
            _group.avatar = group.avatarUrl;
            _group.description = group.description;
            _group.isPrivate = group.isPrivate;
            await _group.save();
            return _group;
        },
        async deleteGroup(_, {groupId}) {
            const group = await GroupModel.findOne({
                where: {id: groupId},
            });

            const users = await group.getUsers();
            const bannedUsers = await group.getBannedUsers();
            const chat = await group.getChat();
            await group.removeBannedUsers(bannedUsers);
            await group.removeUsers(users);
            await chat.destroy();
            await group.destroy();
            return group;
        },
    },
    Query: {
        chat(_, args, ctx) {
            return queryLogic.chat(_, args, ctx);
        },
        async chats(_, args, ctx) {
            return queryLogic.chats(_, args, ctx);
        },
        group(_, args, ctx) {
            return queryLogic.group(_, args, ctx);
        },
        async groups(_, args, ctx) {
            return queryLogic.groups(_, args, ctx);
        },
        async allGroups(_, args, ctx) {
            return queryLogic.allGroups(_, args, ctx);
        },
        async chatGroups(_, args, ctx) {
            return queryLogic.chatGroups(_, args, ctx);
        },
        async users(_, args, ctx) {
            return queryLogic.users(_, args, ctx);
        },
        async friends(_, args, ctx) {
            return queryLogic.friends(_, args, ctx);
        },
        user(_, args, ctx) {
            return queryLogic.user(_, args, ctx);
        },
        async paginatedUsers(_, args, ctx) {
            return queryLogic.paginatedUsers(_, args, ctx);
        },
        items(_, args, ctx) {
            return queryLogic.items(_, args, ctx);
        },
        oneItem(_, args, ctx) {
            return queryLogic.oneItem(_, args, ctx);
        },
        getComments(_, args, ctx) {
            return queryLogic.getComments(_, args, ctx);
        },
        getFollows(_, args, ctx) {
            return queryLogic.getFollows(_, args, ctx);
        },
        getFollowsMe(_, args, ctx) {
            return queryLogic.getFollowsMe(_, args, ctx);
        },
        publicItems(_, args, ctx) {
            return queryLogic.publicItems(_, args, ctx);
        },
        searchUser(_, args, ctx) {
            return queryLogic.searchUser(_, args, ctx);
        },
        checkFollow(_, args, ctx) {
            return queryLogic.checkFollow(_, args, ctx);
        },
        companies(_, args, ctx) {
            console.log(args)
            return queryLogic.companies(_, args, ctx);
        },
        universities(_, args, ctx) {
            console.log(args)
            return queryLogic.universities(_, args, ctx);
        },
        highSchools(_, args, ctx) {
            console.log(args)
            return queryLogic.highSchools(_, args, ctx);
        },
        majors(_, args, ctx) {
            console.log(args)
            return queryLogic.majors(_, args, ctx);
        },
        getFiles(_, args, ctx) {
            console.log(queryLogic.getFiles(_, args, ctx))
            return queryLogic.getFiles(_, args, ctx);

        },
        getVouchers(_, args, ctx) {
            return queryLogic.getVouchers(_, args, ctx);
        },
        getCouponInsentives(_, args, ctx) {
            return getData("http://dev.nextsolutions.com.vn:8234/api/v1/incentive/getCouponCode?merchantId=14181", {
                username: 'dsfe',
                password: 'none',
                token: 'dfdfe'
            }).then(data => {
                let coupon;
                let couponIncentives = [];
                for (coupon in data){
                    let couponObject = {
                        id : data[coupon].id,
                        incentiveProgramId:  data[coupon].incentiveProgramId,
                        code:  data[coupon].code,
                        requiredMinimumAmount:  data[coupon].requiredMinimumAmount,
                        limitedQuantity:  data[coupon].limitedQuantity,
                        discountPercent: data[coupon].discountPercent,
                        discountPrice: data[coupon].discountPrice,
                        limitedPrice: data[coupon].limitedPrice,
                        incentiveName: data[coupon].incentiveName,
                        incentiveDescription:  data[coupon].incentiveDescription,
                        shortDescription:  data[coupon].shortDescription,
                        fromDate:  data[coupon].fromDate,
                        toDate:  data[coupon].toDate,
                        packingCode: data[coupon].packingCode,
                        quantity:  data[coupon].quantity
                    };
                    couponIncentives.push(couponObject);
                    return couponIncentives;

                }




            })

                return []
        },


    },
    //prouci apollo state
    //mutacija za chat
    //mutacija kreiraj chat, contact
    //paginacija za scroll, fetch more
    //subscribtions za chat i chats i contacts
    //auth
    //webrtc
    //accept, ignore chat request, block user
    //css za profile page, fab button start chat

    Chat: {
        users(chat) {
            //sortiraj prema created at message, pa current user na kraj
            //da bi mogao user[0] na avatar
            return chat.getUsers();
        },
        messages(chat) {
            return MessageModel.findAll({
                where: {chatId: chat.id},
                order: [['createdAt', 'DESC']],
            });
        },
        lastMessage(chat) {
            return MessageModel.findOne({
                where: {chatId: chat.id},
                order: [['createdAt', 'DESC']],
            });
        },
    },
    Group: {
        users(group) {
            return group.getUsers();
        },
        bannedUsers(group) {
            return group.getBannedUsers();
        },
        owner(group) {
            return group.getOwner();
        },
        chat(group) {
            return group.getChat();
        },
    },
    Message: {
        from(message) {
            return message.getUser();
        },
    },
    User: {
        chats(user, args, ctx) {
            return userLogic.chats(user, args, ctx);
        },
        friends(user, args, ctx) {
            return userLogic.friends(user, args, ctx);
        },
        groups(user, args, ctx) {
            return userLogic.groups(user, args, ctx);
        },
        jwt(user, args, ctx) {
            return userLogic.jwt(user, args, ctx);
        },
    },
    PageInfo: {
        hasNextPage(connection, args, ctx) {
            return connection.hasNextPage();
        },
        cursor(connection, args, ctx) {
            return connection.cursor();
        },
    },
};

export default resolvers;

/*
   async createMessage(_, { userId, chatId, text }) {
      const chat = await ChatModel.findOne({ where: { id: chatId } });
      console.log(chat);
      const message = await MessageModel.create({
        from: userId,
        text,
        createdAt: new Date(),
      });
      chat.messages.push(message);
      chat.lastMessage = message;
      await chat.save();
      return message;
    },
*/
/*
    async createGroup(_, { group }) {
      const owner = await UserModel.findOne({ where: { id: group.ownerId } });
      const chat = await ChatModel.create({});
      const _group = await GroupModel.create({
        name: group.name,
        avatar: group.avatarUrl,
        description: group.description,
      });
      await owner.addGroup(_group);
      await owner.setGroup(_group);
      await chat.setGroup(_group);
      pubsub.publish(GROUP_ADDED_TOPIC, { [GROUP_ADDED_TOPIC]: _group });
      return _group;
    },
*/
/*
(SELECT g.id FROM groups g, users u, groupuser gu
where g.id = gu."groupId" and u.id = gu."userId"
and g.name = 'default' and u.id = 1)
intersect
(SELECT g.id FROM groups g, users u, groupuser gu
where g.id = gu."groupId" and u.id = gu."userId"
and g.name = 'default' and u.id = 3)
*/

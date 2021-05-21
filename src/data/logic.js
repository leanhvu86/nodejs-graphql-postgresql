import {AuthenticationError, ForbiddenError,} from 'apollo-server';
import Sequelize from 'sequelize';
import {
    ChatModel,
    CompanyModel,
    db,
    FollowModel,
    GroupModel, HighSchoolModel, MajorModel,
    MessageModel, SkillModel,
    UniversityModel, UserAwardModel,
    UserModel, VoucherModel
} from './connectors';
import moment from 'moment';
import {FileStatus} from "./enum/file_status";

const Op = Sequelize.Op;

// reusable function to check for a user with context
function getAuthenticatedUser(ctx) {
    // return UserModel.findOne({ where: { id: 1 } });

    return ctx.user.then(user => {
        if (!user) {
            throw new AuthenticationError('Unauthenticated');
        }
        return user;
    });
}

async function isUserAuth(userId, ctx) {
    const authUser = await getAuthenticatedUser(ctx);
    if (authUser.id !== userId) {
        throw new ForbiddenError('Unauthorized');
    }
    return authUser;
}

export const mutationLogic = {
    async createMessage(_, {text, chatId}, ctx) {
        const user = await getAuthenticatedUser(ctx);
        return MessageModel.create({
            userId: user.id,
            chatId,
            text,
        });
    },
};


async function isNullOrEmpty(value) {
    return (typeof value === "undefined" || value === null);
}

export const queryLogic = {
    async chat(_, args, ctx) {
        //if authUser belongs in that chat
        const authUser = await getAuthenticatedUser(ctx);
        const chatIds = await authUser
            .getChats({
                attributes: ['id'],
            })
            .map(chat => chat.id);
        console.log(JSON.stringify(chatIds, null, 2));
        const isInTheChat = chatIds.find(id => id === args.chatId);
        if (isInTheChat) {
            return ChatModel.findOne({where: {id: args.chatId}});
        }
        throw new ForbiddenError('Unauthorized');
    },
    async chats(_, args, ctx) {
        const authUser = await isUserAuth(args.userId, ctx);
        return authUser.getChats();
    },
    async group(_, args, ctx) {
        /*
        //if authUser is in that group or not in banned array
        //treba public private group
        const authUser = await getAuthenticatedUser(ctx);
        const groupIds = await authUser
          .getGroups({
            attributes: ['id'],
          })
          .map(group => group.id);
        const isInTheGroup = groupIds.find(id => id === args.groupId);
        if (isInTheGroup) {
          return GroupModel.findOne({ where: { id: args.groupId } });
        }
        throw new ForbiddenError('Unauthorized');
        */
        return GroupModel.findOne({where: {id: args.groupId}});
    },
    async groups(_, args, ctx) {
        const authUser = await isUserAuth(args.userId, ctx);
        return authUser.getGroups({where: {name: {[Op.not]: 'default'}}});
    },
    async allGroups(_, args, ctx) {
        return GroupModel.findAll({
            where: {name: {[Op.not]: 'default'}, isPrivate: false},
        });
    },
    async chatGroups(_, args, ctx) {
        const authUser = await isUserAuth(args.userId, ctx);
        return authUser.getGroups();
    },
    async users(_, args, ctx) {
        const user = await getAuthenticatedUser(ctx);
        const users = UserModel.findAll({
            where: {id: {[Op.not]: user.id}},
        });
        return users;
    },

    async checkFollow(_, {userId, target_userId}, ctx) {
        const follow = await FollowModel.findOne({
            where: {
                [Op.and]: [
                    {actor_id: {[Op.eq]: userId}},
                    {follow_user_id: {[Op.eq]: target_userId}},
                    {is_active: {[Op.eq]: true}},
                ]
            },
        });
        if (follow) {
            return true;
        } else {
            return false;
        }
    },
    async companies(_, {user_id}, ctx) {
        return CompanyModel.findAll({
            where: {user_id: {[Op.eq]: user_id}},
        });
    },
    async universities(_, {user_id}, ctx) {
        return UniversityModel.findAll({
            where: {user_id: {[Op.eq]: user_id}},
        });
    },
    async highSchools(_, {user_id}, ctx) {
        return HighSchoolModel.findAll({
            where: {user_id: {[Op.eq]: user_id}},
        });
    },
    async majors(_, {}, ctx) {
        return MajorModel.findAll({
            where: {is_active: {[Op.eq]: true}},
        });

    },

    //getFollows(userId: Int!)
    async getFollows(_, {userId, page_number, page_size}, ctx) {
        if (!page_size) {
            page_size = 10
        }
        const items = await db.query(
            ` SELECT 
          "u"."id" as id, "username","display_name", "avatar", f."description"
        FROM "users" AS "u",
             "follows" AS "f"
        WHERE 
              "f"."actor_id" = :userId
              and "f"."follow_user_id" = u.id
              and f.is_active <> false
        ORDER BY  "f"."createdAt" DESC 
        LIMIT :limit OFFSET :offset;`,
            {
                replacements: {
                    userId: userId,
                    limit: page_size,
                    offset: page_number * page_size,
                },
                type: Sequelize.QueryTypes.SELECT,
            },
        );


        const total = await db.query(
            ` SELECT 
          count(1)
        FROM "users" AS "u",
            "follows" AS "f"
        WHERE 
              "f"."actor_id" = :userId
              and "f"."follow_user_id" = u.id
              and f.is_active <> false;`,
            {
                replacements: {
                    userId: userId,
                    limit: page_size,
                    offset: page_number * page_size,
                },
                type: Sequelize.QueryTypes.SELECT,
            },
        );

        const data = {
            total: total[0].count,
            data: items
        }


        return data;
    },

    async getFiles(_, {user_id, file_type, file_name, page_number, page_size}, ctx) {
        if (!page_size) {
            page_size = 10
        }
        user_id = 100
        let replacements = {}
        let queryStl = `
        SELECT id as id, file_name as file_name, status as status, file_type as file_type, owner_id as owner_id, file_url as file_url, "createdAt"
        FROM public.files  where 1=1 and status <> 0 and owner_id = :userId `
        replacements.userId = user_id
        if (isNullOrEmpty(file_type)) {
            if (file_type == 1) {
                queryStl += ` and file_type in ('jpg','png','jpeg') `
            } else if (file_type == 2) {
                queryStl += ` and file_type in ('doc','docx') `
            } else if (file_type == 3) {
                queryStl += ` and file_type = 'mp3,mp4' `
            }
        }
        if (file_name != '') {
            queryStl += `and lower(file_name) like :fileName`
            file_name = file_name.toLocaleLowerCase()
            let file_name_for_like = "%"
            file_name_for_like += file_name + "%"
            replacements.fileName = file_name_for_like
        }
        let queryForCount = queryStl
        queryStl += `  ORDER BY  "createdAt" DESC 
                      LIMIT :limit OFFSET :offset `
        replacements.limit = page_size
        replacements.offset = page_number * page_size

        const items = await db.query(
            queryStl,
            {
                replacements,
                type: Sequelize.QueryTypes.SELECT,
            },
        );

        let queryCount = `SELECT COUNT(*) as total from ( `
        queryCount += queryForCount
        queryCount += ` ) subQuery; `
        console.log(`query count`)
        console.log(queryCount)


        const total = await db.query(
            queryCount,
            {
                replacements,
                type: Sequelize.QueryTypes.SELECT,
            },
        );


        const changeItems = items.map(item => {
                //check type and set default value
                if (!item.id) {
                    item.id = ''
                }
                if (!item.file_name) {
                    item.file_name = ''
                }
                if (!item.status) {
                    item.status = FileStatus.ACTIVE
                }
                if (!item.owner_id) {
                    item.owner_id = ''
                }

                if (!item.file_type) {
                    item.type = '';
                }

                if (!item.file_url) {
                    item.file_url = '';
                }
                if (total) {
                    item.total = total[0].total
                }
                if (item.createdAt) {

                    item.createdAt = moment.tz(item.createdAt, 'Asia/Ho_Chi_Minh').utcOffset(0).toDate();
                } else {
                    item.createdAt = ''
                }
                return item
            }
        )
        console.log(changeItems)
        return changeItems;


    },
    async getVouchers(_, {user_id, page_number, page_size}, ctx) {
        if (!page_size) {
            page_size = 10
        }
        user_id = 100
        let replacements = {}
        let queryStl = `
                      SELECT id, incentive_program_id, code, app_name, app_code, app_type, title, program_name, status, required_minimum_amount, limited_quantity,
                      discount_percent, discount_price, limited_price, incentive_name, incentive_description, short_description, 
                      from_date, to_date, packing_code, quantity, "createdAt", "updatedAt", image_url
                      FROM public.vouchers WHERE 1=1 and status  <> 0 `
        let queryForCount = queryStl
        queryStl += `  ORDER BY  code,from_date,to_date,"createdAt","updatedAt" DESC 
                      LIMIT :limit OFFSET :offset `
        replacements.limit = page_size
        replacements.offset = page_number * page_size

        const items = await db.query(
            queryStl,
            {
                replacements,
                type: Sequelize.QueryTypes.SELECT,
            },
        );

        let queryCount = `SELECT COUNT(*) as total from ( `
        queryCount += queryForCount
        queryCount += ` ) subQuery; `
        const total = await db.query(
            queryCount,
            {
                replacements,
                type: Sequelize.QueryTypes.SELECT,
            },
        );

        const changeItems = items.map(item => {
                //check type and set default value
                if (!item.id) {
                    item.id = ''
                }
                if (!item.incentive_program_id) {
                    item.incentive_program_id = ''
                }
                if (!item.code) {
                    item.code = ''
                }
                if (!item.app_name) {
                    item.app_name = ''
                }

                if (!item.app_code) {
                    item.app_code = '';
                }

                if (!item.app_type) {
                    item.app_type = '';
                }
                if (!item.title) {
                    item.title = '';
                }
                if (!item.program_name) {
                    item.program_name = '';
                }
                if (!item.status) {
                    item.status = 1;
                }
                if (!item.required_minimum_amount) {
                    item.required_minimum_amount = '';
                }
                if (!item.limited_quantity) {
                    item.limited_quantity = '';
                }
                if (!item.discount_percent) {
                    item.discount_percent = '';
                }
                if (!item.discount_price) {
                    item.discount_price = '';
                }
                if (!item.incentive_name) {
                    item.incentive_name = '';
                }
                if (!item.incentive_description) {
                    item.incentive_description = '';
                }
                if (!item.short_description) {
                    item.short_description = '';
                }
                if (item.from_date) {
                    item.from_date = moment.tz(item.from_date, 'Asia/Ho_Chi_Minh').utcOffset(0).toDate();
                } else {
                    item.from_date = '';
                }
                if (item.to_date) {
                    item.to_date = moment.tz(item.to_date, 'Asia/Ho_Chi_Minh').utcOffset(0).toDate();
                } else {
                    item.to_date = ''
                }
                if (!item.packing_code) {
                    item.packing_code = '';
                }
                if (!item.quantity) {
                    item.quantity = '';
                }
                if (!item.image_url) {
                    item.image_url = '';
                }
                if (total) {
                    item.total = total[0].total
                }
                if (item.createdAt) {

                    item.createdAt = moment.tz(item.createdAt, 'Asia/Ho_Chi_Minh').utcOffset(0).toDate();
                } else {
                    item.createdAt = ''
                }
                return item
            }
        )
        console.log(changeItems)
        return changeItems;


    },


    //getFollows(userId: Int!)
    async getFollowsMe(_, {userId, page_number, page_size}, ctx) {
        if (!page_size) {
            page_size = 10
        }
        const items = await db.query(
            ` SELECT 
          "u"."id" as id, "username", "display_name", "avatar", f."description"
        FROM "users" AS "u",
             "follows" AS "f"
        WHERE 
              "f"."follow_user_id" = :userId
              and "f"."actor_id" = u.id
              and f.is_active <> false
        ORDER BY  "f"."createdAt" DESC 
        LIMIT :limit OFFSET :offset;`,
            {
                replacements: {
                    userId: userId,
                    limit: page_size,
                    offset: page_number * page_size,
                },
                type: Sequelize.QueryTypes.SELECT,
            },
        );

        const total = await db.query(
            ` SELECT 
          count(1)
        FROM "users" AS "u",
            "follows" AS "f"
        WHERE 
          "f"."follow_user_id" = :userId
          and "f"."actor_id" = u.id
          and f.is_active <> false`,
            {
                replacements: {
                    userId: userId,
                    limit: page_size,
                    offset: page_number * page_size,
                },
                type: Sequelize.QueryTypes.SELECT,
            },
        );
        const data = {
            total: total[0].count,
            data: items
        }


        return data;
    },
    async items(_, {userId, page_number, page_size}, ctx) {
        // await getAuthenticatedUser(ctx);
        // await isUserAuth(userId, ctx);
        if (!page_size) {
            page_size = 10
        }
        const items = await db.query(
            ` SELECT 
          "item"."id" as id, "message", "user_id", "type", "url", "item"."description",  string_font, string_color,
          "item"."created_at", "item"."updated_at", "item"."createdAt" , "item"."updatedAt" , "action"."isPrivate" as isprivate, 
          (select count(1) from actions as action where action.target_id = item.id and action.verb = :comment and action.is_active <> false) as comment_number,
          (select count(1) from actions as action where action.target_id = item.id and action.verb = :like and action.is_active <> false) as like,
          (select count(1) from actions as action where action.actor_id = :userId and action.target_id = item.id and  action.verb = :like and action.is_active <> false ) as il,
          (select username from users as us where us.id = "item"."user_id") as username,
          (select display_name from users as us where us.id = "item"."user_id") as display_name,
          (select avatar from users as us where us.id = "item"."user_id") as user_avatar_url
        FROM "items" AS "item",
             "actions" AS "action"
        WHERE  "item"."user_id" = :userId
              and "item"."user_id" = "action"."actor_id"
              and "item"."id" = "action"."target_id"
              and "action"."verb" = :newfeed
              and action.is_active <> false
        ORDER BY  "item"."createdAt" DESC 
        LIMIT :limit OFFSET :offset;`,
            {
                replacements: {
                    userId: userId,
                    limit: page_size,
                    offset: page_number * page_size,
                    newfeed: "newsfeed",
                    comment: "comment",
                    like: "like",
                },
                type: Sequelize.QueryTypes.SELECT,
            },
        );

        const total = await db.query(
            ` SELECT 
          count(1) as total
        FROM "items" AS "item",
             "actions" AS "action"
        WHERE  "item"."user_id" = :userId
              and "item"."user_id" = "action"."actor_id"
              and "item"."id" = "action"."target_id"
              and "action"."verb" = :newfeed
              and action.is_active <> false
        `,
            {
                replacements: {
                    userId: userId,
                    newfeed: "newsfeed",
                    comment: "comment",
                    like: "like",
                },
                type: Sequelize.QueryTypes.SELECT,
            },
        );
        // const items = ItemModel.findAll({
        //     where: { user_id : userId },
        //     order: [['createdAt', 'DESC']],
        //     offset: page_number * 10,
        //     limit: 10
        //   }
        // );
        const changeItems = items.map(item => {
                //check type and set default value
                if (!item.type) {
                    item.type = "0";
                }
                if (!item.like) {
                    item.like = "0";
                    //get like number
                }

                if (!item.comment_number) {
                    item.comment_number = "0";
                    //get commention
                }
                if (!item.url) {
                    item.url = [];
                } else {
                    item.url = item.url.split(",");
                }

                if (item.il == 0) {
                    item.islike = false
                } else {
                    item.islike = true
                }
                if (total) {
                    item.total = total[0].total
                }
                if (item.createdAt) {

                    item.createdAt = moment.tz(item.createdAt, 'Asia/Ho_Chi_Minh').utcOffset(0).toDate();
                }
                console.log(item);
                return item
            }
        )
        return changeItems;

    },
    async publicItems(_, {userId, page_number, page_size, type}, ctx) {
        //const user = await getAuthenticatedUser(ctx);
        if (!page_size) {
            page_size = 10
        }
        if (!type) {
            type = 1
        }
        let queryStr = ` SELECT 
          "item"."id" as id, "message", "user_id", "type", "url", "item"."description",  string_font, string_color,
          "item"."created_at", "item"."updated_at", "item"."createdAt", "item"."updatedAt" , "action"."isPrivate" as isprivate,
          (select count(1) from actions as action where action.target_id = item.id and action.verb = :comment and action.is_active <> false) as comment_number,
          (select count(1) from actions as action where action.target_id = item.id and action.verb = :like and action.is_active <> false) as like,
          (select count(1) from actions as action where action.actor_id = :userId and action.target_id = item.id and  action.verb = :like and action.is_active <> false ) as il,
          (select username from users as us where us.id = "item"."user_id") as username,
          (select display_name from users as us where us.id = "item"."user_id") as display_name,
          (select avatar from users as us where us.id = "item"."user_id") as user_avatar_url
        FROM "items" AS "item",
            "actions" AS "action"
        WHERE  ("item"."user_id" in (select follow_user_id from follows f where actor_id = :userId)
              or "item"."user_id" = :userId)
              and "item"."user_id" = "action"."actor_id"
              and "item"."id" = "action"."target_id"
              and (("action"."isPrivate" <> true) or ( "action"."isPrivate" <> false  and  "item"."user_id" = :userId))
              and "action"."verb" = :newfeed
              and action.is_active <> false `;

        if (type) {
            if (type == 1) {
                queryStr += `ORDER BY  "item"."createdAt" DESC 
                       LIMIT :limit OFFSET :offset;`;
            } else {
                queryStr = `SELECT * FROM (`
                    + queryStr +
                    ` ) AS f ORDER BY f.like DESC 
                       LIMIT :limit OFFSET :offset;`;
            }
        }
        const items = await db.query(queryStr,
            {
                replacements: {
                    userId: userId,
                    limit: page_size,
                    offset: page_number * page_size,
                    newfeed: "newsfeed",
                    comment: "comment",
                    like: "like",
                },
                type: Sequelize.QueryTypes.SELECT,
            },
        );
        const changeItems = items.map(item => {
                //check type and set default value
                if (!item.type) {
                    item.type = "0";
                }
                if (!item.like) {
                    item.like = "0";
                    //get like number
                }

                if (!item.comment_number) {
                    item.comment_number = "0";
                    //get commention
                }
                if (!item.url) {
                    item.url = [];
                } else {
                    item.url = item.url.split(",");
                }

                if (item.il == 0) {
                    item.islike = false
                } else {
                    item.islike = true
                }

                return item
            }
        )
        return changeItems;

    },
    async searchUser(_, {searchText, page_number, page_size}, ctx) {
        //const user = await getAuthenticatedUser(ctx);
        if (!page_size) {
            page_size = 10
        }
        let queryStr = ` SELECT 
          us.id, display_name, email, username, avatar, description, first_name, last_name, concat(first_name, last_name, username ) as searchText,
          (select count(1) from follows as ac where ac.follow_user_id  = us.id and  ac.is_active <> false ) as follow_number
          FROM "users" AS "us"
        `;
        queryStr = `SELECT * FROM (`
            + queryStr +
            ` ) AS f 
                       WHERE 
                       upper(f.searchText) like :searchText
                       ORDER BY f.follow_number DESC 
                       LIMIT :limit OFFSET :offset;`;

        const items = await db.query(queryStr,
            {
                replacements: {
                    searchText: "%" + searchText.toUpperCase() + "%",
                    limit: page_size,
                    offset: page_number * page_size,
                },
                type: Sequelize.QueryTypes.SELECT,
            },
        );

        const changeItems = items.map(item => {
                //check type and set default value
                if (!item.type) {
                    item.type = "0";
                }
                if (!item.like) {
                    item.like = "0";
                    //get like number
                }

                if (!item.comment_number) {
                    item.comment_number = "0";
                    //get commention
                }
                if (!item.url) {
                    item.url = [];
                } else {
                    item.url = item.url.split(",");
                }

                if (item.il == 0) {
                    item.islike = false
                } else {
                    item.islike = true
                }

                return item
            }
        )
        return changeItems;
    },
    async oneItem(_, {userId, itemId}, ctx) {
        //const user = await getAuthenticatedUser(ctx);
        const items = await db.query(
            ` SELECT 
          "item"."id" as id, "message", "user_id", "type", "url", "item"."description",  string_font, string_color,
          "item"."created_at", "item"."updated_at", "item"."createdAt", "item"."updatedAt" , "action"."isPrivate" as isprivate,
          (select count(1) from actions as action where action.target_id = item.id and action.verb = :comment and action.is_active <> false) as comment_number,
          (select count(1) from actions as action where action.target_id = item.id and action.verb = :like and action.is_active <> false) as like,
          (select count(1) from actions as action where action.actor_id = :userId and action.target_id = item.id and  action.verb = :like and action.is_active <> false ) as il,
          (select username from users as us where us.id = "item"."user_id") as username,
          (select display_name from users as us where us.id = "item"."user_id") as display_name,
          (select avatar from users as us where us.id = "item"."user_id") as user_avatar_url
        FROM "items" AS "item",
             "actions" AS "action"
        WHERE "item"."user_id" = :userId
              and "item"."user_id" = "action"."actor_id"
              and "item"."id" = "action"."target_id"
              and "action"."verb" = :newfeed
              and  action.is_active <> false
              and "item"."id" = :itemId
        ORDER BY  "item"."createdAt" DESC 
        LIMIT :limit;`,
            {
                replacements: {
                    userId: userId,
                    limit: 1,
                    newfeed: "newsfeed",
                    comment: "comment",
                    like: "like",
                    itemId: itemId,
                },
                type: Sequelize.QueryTypes.SELECT,
            },
        );

        const changeItems = items.map(item => {
                //check type and set default value
                if (!item.type) {
                    item.type = "0";
                }
                if (!item.like) {
                    item.like = "0";
                    //get like number
                }

                if (!item.comment_number) {
                    item.comment_number = "0";
                    //get commention
                }
                if (!item.url) {
                    item.url = [];
                } else {
                    item.url = item.url.split(",");
                }

                if (item.il == 0) {
                    item.islike = false
                } else {
                    item.islike = true
                }

                return item
            }
        )
        if (items.length > 0) {
            return items[0];
        } else {
            return Promise.reject('item not found');
        }

    },
    //getComments(itemId:Int!, page_number : Int!, page_size: Int):[Item]
    async getComments(_, {userId, itemId, page_number, page_size}, ctx) {
        //const user = await getAuthenticatedUser(ctx);
        if (!page_size) {
            page_size = 10
        }
        console.log(page_size);
        const items = await db.query(
            ` SELECT 
          "item"."id" as id, "message", "user_id", "type", "url", "item"."description",  string_font, string_color,
          "item"."created_at", "item"."updated_at", "item"."createdAt", "item"."updatedAt" ,
          (select count(1) from actions as action where action.target_id = item.id and action.verb = :like and action.is_active <> false) as like,
          (select count(1) from actions as action where action.actor_id = :userId and action.target_id = item.id and  action.verb = :like and action.is_active <> false ) as il,
          (select username from users as us where us.id = "item"."user_id") as username,
          (select display_name from users as us where us.id = "item"."user_id") as display_name,
          (select avatar from users as us where us.id = "item"."user_id") as user_avatar_url
        FROM "items" AS "item",
             "actions" AS "action"
        WHERE "action"."target_id" = :itemId
              and "item"."id" = "action"."target_value_id"
              and "action"."verb" = :comment
              and action.is_active <> false
        ORDER BY  "item"."createdAt" DESC 
        LIMIT :limit OFFSET :offset;`,
            {
                replacements: {
                    userId: userId,
                    itemId: itemId,
                    limit: page_size,
                    offset: page_number * page_size,
                    comment: "comment",
                    like: "like"
                },
                type: Sequelize.QueryTypes.SELECT,
            },
        );

        const total = await db.query(
            ` SELECT 
          count(1) as total
        FROM "items" AS "item",
             "actions" AS "action"
        WHERE "action"."target_id" = :itemId
              and "item"."id" = "action"."target_value_id"
              and "action"."verb" = :comment
              and action.is_active <> false`,
            {
                replacements: {
                    userId: userId,
                    itemId: itemId,
                    comment: "comment",
                    like: "like"
                },
                type: Sequelize.QueryTypes.SELECT,
            },
        );

        // const items = ItemModel.findAll({
        //     where: { user_id : userId },
        //     order: [['createdAt', 'DESC']],
        //     offset: page_number * 10,
        //     limit: 10
        //   }
        // );
        const changeItems = items.map(item => {
                //check type and set default value
                if (!item.type) {
                    item.type = "0";
                }
                if (!item.like) {
                    item.like = "0";
                    //get like number
                }

                if (!item.comment_number) {
                    item.comment_number = "0";
                    //get commention
                }
                if (!item.url) {
                    item.url = [];
                } else {
                    item.url = item.url.split(",");
                }

                if (item.il == 0) {
                    item.islike = false
                } else {
                    item.islike = true
                }

                if (total) {
                    item.total = total[0].total;
                }
                return item
            }
        )


        return changeItems;

    },
    async friends(_, args, ctx) {
        const authUser = await isUserAuth(args.id, ctx);
        return authUser.getFriends();
    },
    async user(_, args, ctx) {
        //everyone can see everyones profile
        const where = args.id ? {id: args.id} : {email: args.email};
        const user = await UserModel.findOne({
            where: where,
        });
        if (user) {
            const universities = await UniversityModel.findAll({
                where: {
                    [Op.and]: [
                        {user_id: {[Op.eq]: args.id}},
                        {is_active: {[Op.eq]: true}}
                    ],
                },
                order: [['id', 'ASC']],
            });
            user.universities = universities;
            const companies = await CompanyModel.findAll({
                where: {
                    [Op.and]: [
                        {user_id: {[Op.eq]: args.id}},
                        {is_active: {[Op.eq]: true}}
                    ],
                },
                order: [['id', 'ASC']],
            });
            user.companies = companies;
            const highSchools = await HighSchoolModel.findAll({
                where: {
                    [Op.and]: [
                        {user_id: {[Op.eq]: args.id}},
                        {is_active: {[Op.eq]: true}}
                    ],
                },
                order: [['id', 'ASC']],
            });
            user.highSchools = highSchools;
            const skills = await SkillModel.findAll({
                where: {
                    [Op.and]: [
                        {user_id: {[Op.eq]: args.id}},
                        {is_active: {[Op.eq]: true}}
                    ],
                },
                order: [['id', 'ASC']],
            });
            user.skills = skills;
            const useAwards = await UserAwardModel.findAll({
                where: {
                    [Op.and]: [
                        {user_id: {[Op.eq]: args.id}},
                        {is_active: {[Op.eq]: true}}
                    ],
                },
                order: [['id', 'ASC']],
            });
            user.useAwards = useAwards;
        }
        return user;
    },
    async paginatedUsers(_, {first, after}, ctx) {
        const authUser = await getAuthenticatedUser(ctx);
        let where;
        if (after) {
            where = {
                [Op.and]: [
                    {id: {[Op.gt]: after}},
                    {id: {[Op.ne]: authUser.id}},
                ],
            };
        } else {
            const firstUser = await UserModel.findOne({
                where: {id: {[Op.ne]: authUser.id}},
                order: [['id', 'ASC']],
            });
            where = {
                [Op.and]: [
                    {id: {[Op.gte]: firstUser.id}},
                    {id: {[Op.ne]: authUser.id}},
                ],
            };
        }

        const users = await UserModel.findAll({
            where,
            order: [['id', 'ASC']],
            limit: first,
        });

        const edges = users.map(user => ({
            node: user,
        }));

        let hasNextPage, cursor;
        cursor = users[users.length - 1].id; //last elem id
        if (users.length < first) {
            hasNextPage = false;
        } else {
            const user = await UserModel.findOne({
                where: {
                    [Op.and]: [
                        {
                            id: {
                                [Op.gt]: users[users.length - 1].id,
                            },
                        },
                        {id: {[Op.ne]: authUser.id}},
                    ],
                },
                order: [['id', 'ASC']],
            });
            hasNextPage = !!user;
        }
        const pageInfo = {
            hasNextPage() {
                return hasNextPage;
            },
            cursor() {
                return cursor;
            },
        };
        return {
            edges,
            pageInfo,
        };
    },
};

export const userLogic = {
    async chats(user, args, ctx) {
        await isUserAuth(user.id, ctx);
        return user.getChats();
    },
    async friends(user, args, ctx) {
        await isUserAuth(user.id, ctx);
        return user.getFriends();
    },
    async groups(user, args, ctx) {
        await isUserAuth(user.id, ctx);
        return user.getGroups();
    },
    jwt(user, args, ctx) {
        return Promise.resolve(user.jwt);
    },
};

import Sequelize from 'sequelize';
import { _ } from 'lodash';
import seed from './seed';

// export const db = new Sequelize(
//   'postgres://postgres:postgres@localhost:5432/postgres',
//   {
//     dialectOptions: {
//       useUTC: false, //for reading from database
//       dateStrings: true,
//     },
//     timezone: 'Asia/Ho_Chi_Minh',
//     logging: true,
//   },
// );
export const db = new Sequelize(
  'newsfeed', 'newsfeed', 'newsfeed', {
    host: '192.168.1.69',
    port: '2345',
    dialect: 'postgres',
    logging:console.log,
    timezone: '+05:30'
  });

// export const db = new Sequelize(
//   'postgres://newsfeed:newsfeed@localhost:5432/newsfeed',
//   {
//     logging: true,
//   },
// );

// tabele, osnovni tipovi od kojih su sacinjeni ostali iz graphql scheme

export const UserModel = db.define('user', {
  email: { type: Sequelize.STRING },
  username: { type: Sequelize.STRING },
  display_name: { type: Sequelize.STRING },
  avatar: { type: Sequelize.STRING },
  description: { type: Sequelize.TEXT },
  lastActiveAt: { type: Sequelize.DATE },
  password: { type: Sequelize.STRING },
  banner_url: { type: Sequelize.STRING },
  fcm_device_token: { type: Sequelize.STRING },
  app: { type: Sequelize.STRING },
});

export const ItemModel = db.define('item', {
  message: { type: Sequelize.STRING },
  user_id: { type: Sequelize.INTEGER },
  type: { type: Sequelize.INTEGER },
  url: { type: Sequelize.STRING },
  description: { type: Sequelize.TEXT },
  created_at: { type: Sequelize.DATE },
  updated_at: { type: Sequelize.DATE },
  string_color: { type: Sequelize.STRING },
  string_font: { type: Sequelize.STRING },
});

export const ActionModel = db.define('action', {
  actor_id: { type: Sequelize.INTEGER },
  verb: { type: Sequelize.STRING },
  target_id: { type: Sequelize.INTEGER },
  target_value_id: { type: Sequelize.INTEGER },
  description: { type: Sequelize.TEXT },
  created_at: { type: Sequelize.DATE },
  updated_at: { type: Sequelize.DATE },
  isPrivate: { type: Sequelize.BOOLEAN },
  is_active: { type: Sequelize.BOOLEAN },
});

export const FollowModel = db.define('follow', {
  actor_id: { type: Sequelize.INTEGER },
  follow_user_id: { type: Sequelize.INTEGER },
  target_id: { type: Sequelize.INTEGER },
  description: { type: Sequelize.TEXT },
  created_at: { type: Sequelize.DATE },
  is_active: { type: Sequelize.BOOLEAN },
});

export const ChatModel = db.define('chat', {});

export const GroupModel = db.define('group', {
  name: { type: Sequelize.STRING },
  avatar: { type: Sequelize.STRING },
  description: { type: Sequelize.STRING },
  isPrivate: { type: Sequelize.BOOLEAN },
});

export const MessageModel = db.define('message', {
  text: { type: Sequelize.TEXT },
});
export const CompanyModel = db.define('company', {
    name: { type: Sequelize.STRING },
    address: { type: Sequelize.STRING },
    job_title: { type: Sequelize.STRING },
    job_position: { type: Sequelize.STRING },
    from_time: { type: Sequelize.DATE },
    to_time: { type: Sequelize.DATE },
    description: { type: Sequelize.TEXT },
    status: { type: Sequelize.BOOLEAN },
    private_check: { type: Sequelize.BOOLEAN },
    user_id: { type: Sequelize.INTEGER },
    is_active: { type: Sequelize.BOOLEAN },
});

export const UniversityModel = db.define('university', {
    name: { type: Sequelize.STRING },
    first_major: { type: Sequelize.STRING },
    second_major: { type: Sequelize.STRING },
    third_major: { type: Sequelize.STRING },
    from_time: { type: Sequelize.DATE },
    to_time: { type: Sequelize.DATE },
    graduated: { type: Sequelize.BOOLEAN },
    private_check: { type: Sequelize.BOOLEAN },
    user_id: { type: Sequelize.INTEGER },
    is_active: { type: Sequelize.BOOLEAN },
});

export const HighSchoolModel = db.define('highschool', {
    name: { type: Sequelize.STRING },
    from_time: { type: Sequelize.DATE },
    to_time: { type: Sequelize.DATE },
    graduated: { type: Sequelize.BOOLEAN },
    private_check: { type: Sequelize.BOOLEAN },
    user_id: { type: Sequelize.INTEGER },
    is_active: { type: Sequelize.BOOLEAN },
});
export const MajorModel = db.define('major', {
    en_name: { type: Sequelize.STRING },
    vi_name: { type: Sequelize.STRING },
    my_name: { type: Sequelize.STRING },
    code: { type: Sequelize.STRING },
    is_active: { type: Sequelize.BOOLEAN },
});
export const SkillModel = db.define('skill', {
    name: { type: Sequelize.STRING },
    detail: { type: Sequelize.TEXT },
    level: { type: Sequelize.INTEGER },
    private_check: { type: Sequelize.BOOLEAN },
    is_active: { type: Sequelize.BOOLEAN },
    user_id: { type: Sequelize.INTEGER },
});
export const UserAwardModel = db.define('userAward', {
    name: { type: Sequelize.STRING },
    detail: { type: Sequelize.TEXT },
    attachment: { type: Sequelize.STRING },
    private_check: { type: Sequelize.BOOLEAN },
    is_active: { type: Sequelize.BOOLEAN },
    user_id: { type: Sequelize.INTEGER },
});

// export const FolderModel = db.define('folder',{
//     folder_name: {type: Sequelize.STRING},
//     parent_folder_id:{type: Sequelize.INTEGER},
//     status:{type: Sequelize.INTEGER},
//     folder_url:{type:Sequelize.STRING},
//     share_type:{type:Sequelize.INTEGER},
//     owner_id:{type:Sequelize.INTEGER},
// });

export const FileModel = db.define('file',{
    file_name :{type:Sequelize.STRING},
    status:{type:Sequelize.INTEGER},
    file_type:{type:Sequelize.STRING},
    owner_id: {type:Sequelize.INTEGER},
    file_url:{type:Sequelize.STRING},
});

export const VoucherModel = db.define('voucher',{
    incentive_program_id :{type:Sequelize.INTEGER},
    code :{type:Sequelize.STRING},
    app_name: {type:Sequelize.STRING},
    app_code:{type:Sequelize.STRING},
    app_type: {type:Sequelize.STRING},
    title: {type:Sequelize.STRING},
    program_name: {type:Sequelize.STRING},
    status: {type:Sequelize.INTEGER},
    required_minimum_amount: {type:Sequelize.INTEGER},
    limited_quantity: {type:Sequelize.INTEGER},
    discount_percent: {type:Sequelize.FLOAT},
    discount_price: {type:Sequelize.INTEGER},
    limited_price: {type:Sequelize.INTEGER},
    incentive_name: {type:Sequelize.STRING},
    incentive_description:  {type:Sequelize.STRING},
    short_description:  {type:Sequelize.STRING},
    packing_code:  {type:Sequelize.STRING},
    quantity:  {type:Sequelize.INTEGER},
    from_date:{ type: Sequelize.DATE },
    to_date:{ type: Sequelize.DATE },
    created_at: { type: Sequelize.DATE },
    updated_at: { type: Sequelize.DATE }
})




// export const FolderHistoryModel = db.define('folder_history',{
//    user_id:{type:Sequelize.INTEGER},
//    folder_id:{type:Sequelize.INTEGER},
//     action_type:{type:Sequelize.STRING},
// });
//
// export const FileHistoryModel = db.define('folder_history',{
//     user_id:{type:Sequelize.INTEGER},
//     file_id:{type:Sequelize.INTEGER},
//     action_type:{type:Sequelize.STRING},
// });
//
// export const UserPermissionModel = db.define('user_permission',{
//     user_id:{type:Sequelize.INTEGER},
//     file_id:{type:Sequelize.INTEGER},
//     folder_id:{type:Sequelize.INTEGER},
//     full_control:{type:Sequelize.BOOLEAN},
//     user_read:{type:Sequelize.BOOLEAN},
//     user_modify:{type:Sequelize.BOOLEAN},
//     user_read_execute:{type:Sequelize.BOOLEAN},
// })

UserModel.belongsToMany(ChatModel, { through: 'ChatUser' });
UserModel.belongsToMany(UserModel, { through: 'Friends', as: 'friends' });
MessageModel.belongsTo(UserModel);
UserModel.hasOne(MessageModel);

ChatModel.belongsToMany(UserModel, { through: 'ChatUser' });

MessageModel.belongsTo(ChatModel);
ChatModel.hasMany(MessageModel);

GroupModel.belongsToMany(UserModel, { through: 'GroupUser' });
UserModel.belongsToMany(GroupModel, { through: 'GroupUser' });

UserModel.belongsToMany(GroupModel, {
  through: 'BannedGroupUser',
  as: 'bannedUsers',
});
GroupModel.belongsToMany(UserModel, {
  through: 'BannedGroupUser',
  as: 'bannedUsers',
});

// FileModel.belongsToMany(UserModel,{
//     through:'FileShareUser',
//     as:'filesharedusers'
// })
//
// UserModel.belongsToMany(FileModel,{
//     through:'FileShareUser',
//     as:'filesharedusers'
// })
//
// FolderModel.belongsToMany(UserModel,{
//     through:'FolderShareUser',
//     as :'foldershareduser'
// })
//
// UserModel.belongsToMany(FolderModel,{
//     through:'FolderShareUser',
//     as :'foldershareduser'
// })



GroupModel.belongsTo(UserModel, {
  as: 'owner',
  foreignKey: 'ownerId',
  targetKey: 'id',
});
UserModel.hasOne(GroupModel, {
  foreignKey: 'ownerId',
  sourceKey: 'id',
});
ChatModel.belongsTo(GroupModel);
GroupModel.hasOne(ChatModel);

// db.sync({ force: true })
//   .then(async () => await seed())
//   .catch(error => console.log(error));

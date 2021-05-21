import {gql} from 'apollo-server';

export const typeDefs = gql`
  # declare custom scalars
  scalar Date

  type User {
    id: Int!
    email: String
    username: String
    avatar: String
    display_name: String
    description: String
    chats: [Chat]
    friends: [User]
    groups: [Group]
    universities: [University]
    highSchools: [HighSchool]
    companies: [Company]
    skills: [Skill]
    userAwards: [UserAward]
    lastActiveAt: Date
    jwt: String
    banner_url: String
    first_name: String
    last_name: String
    birthday: Date
  }
  
  type File {
   id : Int!
   file_name : String!
   status : Int!
   file_type : String!
   total: String
   owner_id : Int!
   file_url : String!
   createdAt: Date!
  }
 

  type UserPublic {
    id: Int!
    email: String
    username: String!
    avatar: String
    description: String
    follow_number: Int
    first_name: String
    last_name: String
    display_name: String
  }

  type Follow{
    total: Int,
    data: [UserPublic]
  }


  type Item {
    id: Int!
    user_id: Int!
    user_avatar_url: String
    username:String
    islike: Boolean
    like: Int
    type: Int
    message: String
    url: [String]
    description: String
    createdAt: Date!
    updatedAt: Date!
    comment_number: Int
    comments: [Item]
    position: Int
    string_font: String
    string_color: String
    total: Int
    display_name: String
    isprivate: Boolean
  }

  type Action {
    id: Int!
    actor_id: Int!
    verb: String
    target_id: String
    description: String
    isPrivate: Boolean
    createdAt: Date!
    updatedAt: Date!
  }
  type Company {
    id: Int!
    user_id: Int!
    address: String
    job_title: String
    job_position: String
    name: String
    description: String
    private_check: Boolean
    status: Boolean
    from_time: Date
    to_time: Date
    createdAt: Date!
    updatedAt: Date!
    is_active: Boolean!
  }
 
  
  type University {
    id: Int!
    user_id: Int!
    first_major: String
    second_major: String
    third_major: String
    name: String
    private_check: Boolean
    graduated: Boolean
    from_time: Date!
    to_time: Date
    createdAt: Date!
    updatedAt: Date!
    is_active: Boolean!
  }
  
  type HighSchool {
    id: Int!
    user_id: Int!
    name: String
    private_check: Boolean
    graduated: Boolean
    from_time: Date!
    to_time: Date
    is_active: Boolean!
    createdAt: Date!
    updatedAt: Date!
  }
  
  type Major {
    id: Int!
    en_name: String
    vi_name: String
    my_name: String
    code: String
  }
  
  type Skill {
    id: Int!
    name: String
    detail: String
    level: Int
    private_check: Boolean
    is_active: String
    user_id: Int!
  }
  
  type UserAward {
    id: Int!
    name: String
    detail: String
    attachment: String
    is_active: String
    user_id: Int!
    private_check: Boolean
  }
  
  
  type File_Test {
    filename: String!
    mimetype: String!
    encoding: String!
  }
  
  type CreateFilePayload {
    file: File!
    }
    
  type CreateFilesPayload {
    files: [File]
    }


  type Chat {
    id: Int!
    messages: [Message]
    users: [User]!
    lastMessage: Message
    createdAt: Date!
    updatedAt: Date!
  }
  
    type CouponIncentive {
    id : Int,
    incentiveProgramId: Int,
    code: String,
    requiredMinimumAmount: Float,
    limitedQuantity: Int,
    discountPercent:Float,
    discountPrice:Float,
    limitedPrice:Float,
    incentiveName: String,
    incentiveDescription: String,
    shortDescription: String,
    fromDate: String,
    toDate: String,
    packingCode: String,
    quantity: Int
  }
  
  type Group {
    id: Int!
    name: String
    avatar: String
    description: String
    owner: User
    users: [User]
    bannedUsers: [User]
    chat: Chat
    isPrivate: Boolean
    createdAt: Date!
    updatedAt: Date!
  }
  
  
  type Diary {
    id: Int!,
    title: String,
    description: String,
    shortDescription: String,
    content: String!,
    status: Int,
     createdAt: Date!,
    updatedAt: Date!
  }
  
  
  

  type Message {
    id: Int!
    from: User!
    text: String!
    createdAt: Date!
  }

 
 
  

  # ======= pagination =========

  type UserConnection {
    edges: [UserEdge]
    pageInfo: PageInfo!
  }

  type UserEdge {
    node: User!
  }

  type PageInfo {
    cursor: Int!
    hasNextPage: Boolean!
  }

  type MessageTest {
    id: String
    content: String
  }
  
 
  
  type Voucher {
  id: Int!,
  incentive_program_id : Int!,
  code : String!,
  app_name: String,
  app_code: String,
  app_type: String,
  title: String,
  program_name: String,
  status: Int!,
  required_minimum_amount: Int,
  limited_quantity: Int,
  discount_percent: Float,
  discount_price: Int,
  limited_price: Int,
  incentive_name: String,
  incentive_description: String,
  short_description: String,
  packing_code: String,
  image_url: String,
  quantity: Int,
  from_date:Date,
  to_date:Date,
  total: Int
  createdAt: Date!,
  updatedAt: Date!
  }
  
  interface MutationResponse {
    code: String!
    success: Boolean!
    message: String!
  }
  
  
  
    #========= Input =============
   input CreateGroupInput {
    name: String!
    avatarUrl: String!
    description: String!
    ownerId: Int!
    isPrivate: Boolean!
  }
  
   input CreateFileInput {
   file_name: String!
   file_url: String!
  }
  
   input CreateVoucherInput {
  incentive_program_id : Int,
  code : String!,
  app_name: String,
  app_code: String,
  app_type: String,
  title: String,
  program_name: String,
  status: Int,
  required_minimum_amount: Int,
  limited_quantity: Int,
  discount_percent: Float,
  discount_price: Int,
  limited_price: Int,
  incentive_name: String,
  incentive_description: String,
  short_description: String,
  packing_code: String,
  image_url: String,
  quantity: Int,
  from_date:String,
  to_date:String,
  total: Int
  }
  
  
  
 
  #======= /pagination =========

  type Query {
    user(email: String, id: Int): User
    users(id: Int!): [User]
    paginatedUsers(first: Int, after: Int): UserConnection
    friends(id: Int!): [User]
    chat(chatId: Int!): Chat
    chats(userId: Int!): [Chat]
    group(groupId: Int!): Group
    groups(userId: Int!): [Group]
    allGroups: [Group]
    chatGroups(userId: Int!): [Group]
    items(userId:Int!, page_number : Int!, page_size: Int):[Item]
    oneItem(userId: Int!, itemId : Int!):Item
    getComments(userId: Int, itemId: Int!, page_number : Int!, page_size: Int):[Item]
    getFollows(userId: Int!, page_number : Int!, page_size: Int): Follow
    getFollowsMe(userId: Int!, page_number : Int!, page_size: Int): Follow
    publicItems(userId:Int!, page_number : Int!, page_size: Int, type: Int):[Item]
    searchUser(searchText:String!, page_number : Int!, page_size: Int): [UserPublic]
    checkFollow(userId: Int!, target_userId: Int!): Boolean
    companies(user_id: Int!): [Company]
    universities(user_id: Int!): [University]
    highSchools(user_id: Int!): [HighSchool]
    majors(id: Int): [Major]
    getFiles(user_id: Int!,file_name: String, file_type: Int!,page_number: Int!,page_size: Int):[File]
    getCouponInsentives(user_id: Int!): [CouponIncentive]
    getVouchers(user_id: Int!,page_number: Int!,page_size: Int) :[Voucher]
  }

  type Mutation {
    createMessage(userId: Int!, groupId: Int!, text: String!): Message
    login(username: String!, password: String!, type: String): User
    register(username: String!, email: String!, password: String!): User
    createUser(username: String!, email: String, password: String!, avatar_url: String): User
    updateUser(username: String!, display_name: String, first_name: String, last_name: String, birthday: Date, email: String, password: String, avatar_url: String, banner_url: String, fcm_device_token: String): User
    createDefaultGroup(userId: Int!, contactId: Int!): Group
    createGroup(group: CreateGroupInput!): Group
    editGroup(groupId: Int!, group: CreateGroupInput!): Group
    addUserToGroup(groupId: Int!, userId: Int!): User
    removeUserFromGroup(groupId: Int!, userId: Int!): User
    deleteGroup(groupId: Int!): Group
    addFriend(userId: Int!, friendId: Int!): User
    removeFriend(userId: Int!, friendId: Int!): User
    singleUpload(f: Upload!): File
    addPost(user_id: Int!,message: String!, url: [String], description: String, type: Int, isPrivate: Boolean, string_font: String, string_color: String): Item
    addComment(user_id: Int!, target_item_id: Int!, message: String!, url: [String], type: Int, string_font: String, string_color: String): Item
    addLike(user_id: Int!, target_item_id: Int!): String
    disLike(user_id: Int!, target_item_id: Int!): String
    deletePost(itemId: Int!): String
    addFollow(userId: Int!, target_userId: Int): String
    disFollow(userId: Int!, target_userId: Int): String
    updatePost(itemId: Int!,message: String!, url: [String], description: String, type: Int, isPrivate: Boolean, string_font: String, string_color: String): Item
    updateComment(itemId: Int!,message: String!, url: [String], description: String, type: Int, string_font: String, string_color: String): Item
    deleteComment(itemId: Int!): String
    createCompany(name: String!,address: String,job_title: String, job_position: String,  from_time: Date!, to_time: Date, status: Boolean,  private_check: Boolean,user_id: Int!): Company
    updateCompany(id :Int!, name: String, address: String, job_title: String,job_position: String,  from_time: Date, to_time: Date,status: Boolean,  private_check: Boolean,user_id:Int!): Company
    deleteCompany(id :Int!,user_id:Int!): Company
    createUniversity(name: String!, first_major: String, second_major: String,third_major: String, from_time: Date!, to_time: Date, graduated: Boolean!,  private_check: Boolean!,user_id: Int! ) : University
    updateUniversity(id :Int!,name: String, first_major: String, second_major: String,third_major: String, from_time: Date, to_time: Date, graduated: Boolean,  private_check: Boolean,is_active: Boolean,user_id:Int! ) : University
    deleteUniversity(id :Int!,user_id:Int!): University
    createHighSchool(name: String!,  from_time: Date!, to_time: Date, graduated: Boolean!,  private_check: Boolean!,user_id: Int! ) : HighSchool
    updateHighSchool(id :Int!,name: String, from_time: Date, to_time: Date, graduated: Boolean,  private_check: Boolean,is_active: Boolean ,user_id:Int!) : HighSchool
    deleteHighSchool(id :Int!,user_id:Int!): HighSchool
    createSkill(name: String!,  detail: String,  level: Int,private_check: Boolean, user_id: Int! ) : Skill
    updateSkill(id :Int!,name: String,  detail: String,  level: Int,private_check: Boolean,,user_id:Int!,is_active: Boolean ) : Skill
    deleteSkill(id :Int!,user_id:Int!): Skill
    createUserAward(name: String!,  detail: String!,  attachment: String, private_check:Boolean , user_id: Int! ) : UserAward
    updateUserAward(id :Int!,name: String,  detail: String,  attachment: String, private_check:Boolean  ,user_id:Int!,is_active: Boolean) : UserAward
    deleteUserAward(id :Int!,user_id:Int!): UserAward
    createMajor(en_name: String, vi_name: String, my_name: String, code: String) : Major
    updateMajor(id :Int!, en_name: String, vi_name: String, my_name: String, code: String, is_active: Boolean ) : Major
    deleteMajor(id :Int!): Major
    createFile(file: CreateFileInput!, user_id:Int!): File
    updateFile(id : Int!,file_url : String,file_name:String,user_id: Int!): File    
    deleteFile(id: Int!,user_id:Int!): File
    deleteFiles(ids: [Int]!,user_id:Int!): String
    createFiles(files: [CreateFileInput!]!,user_id:Int!): [File]
    createVouchers(vouchers:[CreateVoucherInput!]!):String
    updateVoucher(voucher:CreateVoucherInput!):String
    findVoucherByCode(code:String!):[Voucher]
    
  }

  type Subscription {
    messageAdded(groupId: Int!): Message
    groupAdded(userId: Int!): Group
    messageInGroupAdded(userId: Int!): Group
    messageTestCreated(id: Int): MessageTest
  }

  

  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }
`;
export default typeDefs;

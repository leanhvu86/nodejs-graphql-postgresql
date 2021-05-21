module.exports = app => {
    const chat_library = require("./chat_library");
    app.get("/getRoom", chat_library.getRooms);
    app.post("/changeRoomName", chat_library.changeRoomName);
    app.post("/sendMessage", chat_library.sendMessage);
};

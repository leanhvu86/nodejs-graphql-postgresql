import * as sdk from "matrix-js-sdk";
import {chat_config} from '../config';
import {MatrixHttpApi} from 'matrix-js-sdk';
import {catchError} from 'rxjs/operators';
import {message_type} from "./chat_constant";
import {config} from "rxjs";

const client = sdk.createClient(chat_config.chat_server_port);

let rooms = undefined;
let roomArray = [];
let userId = '';
let accessToken = '';

function getRooms() {
    rooms = client.getRooms();
    rooms.forEach(room => {
        userId = room.myUserId
        roomArray.push({
            roomId: room.roomId,
            name: room.name,
            members: room.currentState.members
        })
    });
}

exports.getRooms = async (req, res) => {
    return res.send({
        'status': 200,
        'room': roomArray,
        'message': 'Send message to room successful!'
    })
}
exports.sendMessage = async (req, res) => {
    // console.log(req)

    let data = JSON.parse(req.body.payload);
    let status = null;
    let priority = null;
    let assignee = null;

    let field = data.attachments;
    for (let i = 0; i < field.length; i++) {
        let at = field[i].fields;

        for (let j = 0; j < at.length; j++) {
            let temp = at[j];


            if (temp.title == "Status") {
                status = temp.value;
            }
            if (temp.title == "Priority") {
                priority = temp.value;
            }

            if (temp.title == "Assignee") {
                assignee = temp.value;
            }
        }


        // for(let j = 0;j<at.length;j++){
        //     console.log('attack 12333333333',at[j])
        //
        // }

    }

    let text = data.text;
    let projectName= text.substring(text.indexOf('[')+1,text.indexOf(']'));
    let newText = text.split("http://localhost:3000/").join("http://qlda.nextsolutions.com.vn/");
    // newText = newText.split("*").join("");
    newText = newText.replace("<", "");
    newText = newText.replace(">", "");
    newText = newText.replace("[", "<strong>");
    newText = newText.replace("]", "</strong>");
    newText = newText.replace("*", "<strong>");
    newText = newText.replace("*", "</strong>");
    newText = newText.replace("|", "");
    newText = newText.replace("-", "");
    newText = newText.replace("(", " ");
    newText = newText.replace(")", "");
    newText = newText.replace("Issue", "<br/><strong> Issue</strong>");
    newText += "<br/>"
    if (status != null) {
        newText += "    <strong>Status: </strong>  "
        newText += status
    }
    if (priority != null) {
        newText += "    <br/><strong>Priority: </strong>:  "
        newText += priority
    }
    if (assignee != null) {
        newText += "    <br/><strong>Assignee: </strong> "
        newText += assignee
    }



    var content = {
        msgtype: "m.text",
        format: "org.matrix.custom.html",
        body: newText.toString(),
        formatted_body: '<strong>' + newText + '</strong>'
    };

    let channel = data.channel;
    if (channel) {
        if (!channel.startsWith('@')) {
             client.sendMessage(
                channel, {
                    msgtype: "m.text",
                    format: "org.matrix.custom.html",
                    body: "**" + newText + "**",
                    formatted_body: newText
                },
            );
            return res.send({
                'status': 200,
                'message': 'Send message to room successful!'
            });
        } else {
            let roomIdChoose = '';
            let checkRoomExist = false;
            roomArray = client.getRooms();
            for (let i = 0; i < roomArray.length; i++) {
                // let test = Object.keys(roomArray[i])
                // Object.keys(test).forEach(function(key) {
                //     orderedData[key] = test[key];
                // });
                // console.log('qwertyuioiuytrertyuiuytr',roomArray[i].currentState.members)
                let membersInRoom = Object.keys(roomArray[i].currentState.members)
                if (membersInRoom.length) {
                    if (membersInRoom.length == 2) {
                        for (const key of Object.keys(membersInRoom)) {
                            const user = membersInRoom[key];
                            const userObject = membersInRoom[user]
                            // console.log('qwertyuioiuytrertyuiuytr',userObject)
                            if (user === channel + ":demo.nextsolutions.com.vn") {
                                roomIdChoose = roomArray[i].roomId;
                                checkRoomExist = true;
                                 client.sendMessage(
                                    roomIdChoose, {
                                        msgtype: "m.text",
                                        format: "org.matrix.custom.html",
                                        body: "**" + newText + "**",
                                        formatted_body: newText
                                    },
                                );

                                return res.send({
                                    'status': 200,
                                    'message': 'Send message to room successful!'
                                });
                            }
                        }
                    }
                }
            }
            if (checkRoomExist === false) {
                let check;
                let temp = [];
                let number = Math.floor(Math.random() * 100) + channel;

                temp.push(channel + ":demo.nextsolutions.com.vn")
                // temp.push(userId);
                const content = {
                    room_alias_name: projectName+channel+ number.toString(),
                    visibility: 'private',
                    name: projectName+channel + number.toString(),
                    topic: '',
                    invite: temp
                };
                const room = await client.createRoom(content);
                if (room) {
                    check =   client.sendMessage(
                        room.room_id, {
                            msgtype: "m.text",
                            format: "org.matrix.custom.html",
                            body: "**" + newText + "**",
                            formatted_body: newText
                        },
                    );
                    // check = await client.sendMessage(
                    //     " !haVKhbZWzSGyKlWpEV:demo.nextsolutions.com.vn", {
                    //         msgtype: "m.text",
                    //         format: "org.matrix.custom.html",
                    //         body: "**" + newText + "**",
                    //         formatted_body: newText
                    //     },
                    // );
                }
                return res.send({
                    'status': 200,
                    'message': 'Send message to room successful!'
                });
            }

        }
    }
    return res.send({
        'status': 200,
        'message': 'Send message to room successful!'
    });

    // const groupName = req.body.room.name;
    // console.log('roomIdChoose', groupName);
    // let roomIdChoose = '';
    // let userAssign = 'leminhanh';
    // const chatMessage = 'Bạn có thông báo mới từ Redmine Admin';
    // let checkRoom = false;
    // let roomChoose = undefined;
    // let check = undefined;
    // let members = undefined;
    // roomArray.forEach(room => {
    //     if (room.name === groupName) {
    //         roomIdChoose = room.roomId;
    //         roomChoose = room;
    //         members = room.members;
    //         checkRoom = true;
    //     }
    // });
    // console.log(roomIdChoose)
    // if (checkRoom === true) {
    //     // let checkUserAssignExist = false;
    //     // let data = {
    //     //     'search_term': userAssign
    //     // }
    //     // let matrix_api = await client.searchUserDirectory(data)
    //     // console.log(matrix_api.result);
    //     // for (const key of Object.keys(members)) {
    //     //     const user = members[key];
    //     //     if (user.displayName === userAssign) checkUserAssignExist = true;
    //     // }
    //     check = await client.sendMessage(
    //         roomIdChoose, {msgtype: message_type.TEXT, body: chatMessage},
    //     );
    // } else {
    //     const temp = [];
    //     // temp.push(userId);
    //     const content = {
    //         room_alias_name: groupName,
    //         visibility: 'private',
    //         name: groupName,
    //         topic: groupName,
    //         invite: temp
    //     };
    //     const room = client.createRoom(content);
    //     if (room) {
    //         check = await client.sendMessage(
    //             roomIdChoose, {msgtype: message_type.TEXT, body: chatMessage},
    //         );
    //     }
    // }
    // if (check !== undefined && check.event_id !== undefined) {
    //     return res.send({
    //         'status': 200,
    //         'message': 'Send message to room successful!'
    //     });
    // } else {
    //     return res.send({
    //         'status': 500,
    //         'message': 'Send message to room fail!'
    //     });
    // }

}
exports.changeRoomName = async (req, res) => {
    const oldName = req.body.room.oldName;
    const newName = req.body.room.newName;
    let roomIdChoose = '';
    roomArray.forEach(room => {
        if (room.name === oldName) {
            roomIdChoose = room.roomId;
        }
    });
    const check = await client.setRoomName(roomIdChoose, newName);
    if (check.event_id !== undefined) {
        return res.send({
            'status': 200,
            'message': 'Change room name successful!'
        });
    } else {
        return res.send({
            'status': 500,
            'message': 'Change room name fail!'
        });
    }

}
exports.login = async () => {
    client.login('m.login.password', {user: chat_config.username, password: chat_config.password}).then((response) => {
        client.on('sync', (state) => {
            switch (state) {
                case 'PREPARED':
                    getRooms();
                    break;
            }
        });
        client.startClient({initialSyncLimit: 2});
        accessToken = client._http.opts.accessToken;
    }), catchError(error => of(null));
};

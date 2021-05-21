import FCM from 'fcm-node'
const serverKey = 'AAAAW80_rh0:APA91bEcC9yRqDg-sxOrtLJHgJJDnkZ0rqicuPuHJPntFUCkfU54Ue4riGb3gIgj0SyvJG-UdufAJAUvxpu6qAFHqazKfESv0nVIeSLl4-H_rQ9mtL1E7fKQUTYpcHc-FFXd2Hew6OTZ'; //put your server key here
const fcm = new FCM(serverKey);

export function sento(to, m, text){
    console.log(to);
    let messagem = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
        to: to, 
        //to: 'fHeKontObO0:APA91bF2U_nSQaiEdculOejF3DWNNwEmVsQBFC8RInA1EnXZuz8Z2R2GO-V3mbcZ6w8Qn7DuxBC-9dA-oGJB-Uk43a3zlxl5a_PMG2RC39ehP_Yc58jCjyKycyODCwLR6qnvGhz5WVsg', 
        
        notification: {
            title: m.username + text, 
            body: m.message
        },
        
        data: {  //you can send only notification or only data(or include both)
            title: m.username + text, 
            itemId: m.id,
            click_action: 'openPost',
            date: m.createAt,
            appId: 'newsfeed',
        }
    };

    fcm.send(messagem, function(err, response){
        if (err) {
            console.log(err);
            console.log("Something has gone wrong!", to);
        } else {
            console.log("Successfully sent with response: ", response);
        }
       });

    return true;
};


export function Test(){
    let messagem = { 
        //to: to, 
        to: '9efab2adca190a0272dd0eefe571613337e1863c90bbe3e64cf911a11bb45128', 
        
        notification: {
            title: "Test", 
            body: "Test Body"
        },
        
        data: {  
           
        }
    };

    fcm.send(messagem, function(err, response){
        if (err) {
            console.log(err);
            console.log("Something has gone wrong!");
        } else {
            console.log("Successfully sent with response: ", response);
        }
       });

    return true;
};

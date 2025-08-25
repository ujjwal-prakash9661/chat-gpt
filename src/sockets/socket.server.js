const { Server } = require("socket.io");
const cookie = require('cookie')
const jwt = require('jsonwebtoken')
const userModel = require('../models/user.model')
const aiService = require('../services/ai.service');
const chatModel = require("../models/chat.model");
const messageModel = require('../models/message.model')

const {createMemory, queryMemory} = require('../services/vector.service')

function initSocketServer(httpServer)
{
    const io = new Server(httpServer, {
        cors : {
            origin : 'http://localhost:5173',
            allowedHeaders : [ 'Content-Type', 'Authorization'],
            credentials : true
        }
    })

    io.use(async(socket, next) => {
        //iske andar socket ko connect disconnect krna likhte hain 


        const cookies = cookie.parse(socket.handshake.headers?.cookie || "")        

        // console.log("Socket connection cookies : ",cookies)

        if(!cookies.token)
        {
            next(new Error('Authentication Error : No token provided'))
        }

        try
        {
            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET)

            const user = await userModel.findById(decoded.id)
            
            socket.user  = user
            next()
        }

        catch(err)
        {
            next(new Error("Authentication Failed : Invalid token"))
        }
        
        
    })  //ye socket-io ka middleware hai

    io.on("connection", (socket) => {
        // console.log("User Connected : ", socket.user)
        // console.log("New socket connection", socket.id)

        socket.on("ai-message", async(messagePayload) => {
            // console.log(messagePayload)
            
            
            
            // const message = await messageModel.create({
            //     chat : messagePayload.chat,
            //     user : socket.user._id,
            //     content : messagePayload.content,
            //     role : "user",
            // })

            const [message, vectors ] = await Promise.all([
                messageModel.create({
                    chat : messagePayload.chat,
                    user : socket.user._id,
                    content : messagePayload.content,
                    role : "user",
                }),

                aiService.generateVector(messagePayload.content)
            ])


            // const vectors = await aiService.generateVector(messagePayload.content)

            // console.log(vectors)

            await createMemory({
                vectors,
                messageId : "4388349",
                metadata : {
                    chat : messagePayload.chat,
                    user : socket.user._id,
                    test : messagePayload.content
                }
            })

            const [memory, chatHistory ] = await Promise.all([

                queryMemory({
                    queryVector : vectors,
                    limit : 3,
                    metadata : {
                        user : socket.user._id
                    }
                }),

                messageModel.find({
                    chat : messagePayload.chat
                }).sort({ createdAt : -1 }).limit(20).lean().then(message => message.reverse())
            ])

            // const chatHistory = await messageModel.find({
            //     chat : messagePayload.chat
            // }).sort(({createdAt : -1}).limit(20).lean()).reverse()

            // console.log("Chat History : ", chatHistory);

            const stm = chatHistory.map(item => {
                return {
                    role : item.role,
                    parts : [ { text : item.content } ]
                }
            })

            const ltm = [
                {
                    role : "user",
                    parts : [{

                        text: `

                        these are some previous messages from the chat, use them to generate a response

                        ${memory.map(item => item.metadata.text).join("\n")}`
                        
                    }]
                }
            ]

            const response = await aiService.generateResponse([ ...ltm, ...stm ])


            // const responseMessage = await messageModel.create({
            //     chat : messagePayload.chat,
            //     user : socket.user._id,
            //     content : response,
            //     role : "model",
            // })

                    
            socket.emit('ai-response', {
                content : response,
                chat : messagePayload.chat
            })

            const [ responseMessage, responseVectors ] = await Promise.all([
                messageModel.create({
                    chat: messagePayload.chat,
                    user: socket.user._id,
                    content: response,
                    role: "model"
                }),

                aiService.generateVector(response)
            ])

            await createMemory({
                vectors : responseVectors,
                messageId : responseMessage._id,
                metadata : {
                    chat : messagePayload.chat,
                    user : socket.user_id,
                    text : response
                }
            })
        })
    })
}

module.exports = initSocketServer
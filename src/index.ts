import express, { NextFunction, Request, Response, Router } from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import {Customer, Product} from './types'
import databaseA from './database'
import CustomerModel from './models/customer'
import {v4 as uuidv4} from 'uuid'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import connectDB from './database'
import jwt, { VerifyErrors } from 'jsonwebtoken'
import path from 'path'

connectDB();
const sec: string = process.env.TOKEN_SECRET as string;
const generateAcessToken = (username: any) => {
    return jwt.sign({username}, sec, {expiresIn: '600s'})
}
// require('dotenv').config();
const app = express();
const PORT = 4000;
const router = Router();
app.use(bodyParser.json());
// app.use(cors);
const corsOptions = {
    origin : '*',
    credential: true
}
//auth
router.post('/api/v1/auth', (req, res) => {
    const token = generateAcessToken({username: req.body.username})
    res.json(token);
})
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] 
    if (token == null){
        return res.status(401);
    } 
    jwt.verify(token, sec, (err: VerifyErrors | null , decoded: any) => {
        if (err){
            return res.status(403).json({msg:'Forbidden', error: err.message })
        }
        (req as any) = decoded;
    })
    next();
}
app.use(cors(corsOptions));

app.use(express.static(path.join(__dirname, '../../dist')));
app.get('/.', (req, res) => {
    res.sendFile(path.join(__dirname,'../views/index.html'));
})
//mongoose connect
// mongoose.connect(process.env.MONGODB_URL || '')
// .then(() => console.log('mongodb 연결 완료'))
// .catch(err => {
//     console.error('mongodb 연결 실패', err)
// })

// 서버 코드
app.post('/api/v1/customers', async (req: Request, res: Response) => {
    const { name, address, email } = req.body;
    try {
        const newCustomer = new CustomerModel({
            id: uuidv4(),
            name,
            address,
            email,
        });
        const savedCustomer = await newCustomer.save();
        res.status(201).json(savedCustomer);
    } catch (error) {
        console.error('고객 저장 실패', error);
        res.status(500).json({ error: '데이터베이스에 고객 정보 저장 실패' });
    }
});


const ranId = () => {
    return Math.floor(Math.random()*1000);
}
router.get("/api/v1/customers", authenticateToken, async (req, res) => {
    try{
        const customers = await CustomerModel.find();
        res.json(customers);
    }catch(error){
        console.error('고객 조회 실패', error);
        res.status(500).json({error: '조회 중 오류가 발생하였습니다.'})
    }
});

router.get("/api/v1/customers/:id", async(req, res)=> {
    try{
        const customer = await CustomerModel.findOne({id: req.params.id});
        if(!customer){
            return res.sendStatus(404);
        }
        res.json(customer);
    } catch(error){
        console.error('고객 조회 실패', error);
        res.status(500).json({error: '조회 중 오류가 발생하였습니다.'})
    }
});

router.post("/api/v1/customers", async (req, res) => {
    const {name,address,email} = req.body
    const newCustomer = new CustomerModel({
        id: uuidv4(),
       name,
        address,
        email,
    })
    try{
        const savedCustomer = await newCustomer.save();
        res.status(201).json(savedCustomer);
    }catch(error){
        console.error('고객 저장 실패', error);
        res.status(500).json({error: '데이터베이스에 고객 정보 저장 실패'})
    }
})

router.put("/api/v1/customers/:id", async (req, res) => {
    try{
        const customer = await CustomerModel.findOneAndUpdate({id: req.params.id}, req.body, {new: true});
        if(!customer){
            return res.sendStatus(404);
        }
        res.json(customer);
    }catch(error){
        console.error('고객 정보 수정 오류', error);
        res.status(500).json({error: '고객 정보 수정 중 오류 발생하였습니다.'})
    }

})
router.delete("/api/v1/customers/:id", async (req,res)=> {
    try{
        const result = await CustomerModel.findOneAndDelete({id: req.params.id});
        if(!result){
            return res.sendStatus(404);
        }
        res.status(200).json({msg: '고객 정보 삭제 완료'})
    }catch(error){
        console.error('고객 삭제 실패', error);
        res.status(500).json({error: '고객 정보 삭제 중 오류 발생하였습니다.'})
    }
})

app.use(router);
app.listen({port: PORT}, () => {
    console.log(`localhost:${PORT}에서 실행`)
})
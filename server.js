const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'chat_battle',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// フォーマット用関数
function formatDate(date) {
    const yyyy = date.getFullYear();
    const mm = ('0' + (date.getMonth() + 1)).slice(-2); // 月を2桁に
    const dd = ('0' + date.getDate()).slice(-2); // 日を2桁に
    const hh = ('0' + date.getHours()).slice(-2); // 時を2桁に
    const min = ('0' + date.getMinutes()).slice(-2); // 分を2桁に
    const sec = ('0' + date.getSeconds()).slice(-2); // 秒を2桁に
    return `${yyyy}/${mm}/${dd} ${hh}:${min}:${sec}`;
}

app.post('/create-topic', async (req, res) => {
    try {
        const { title } = req.body;
        const created_at = new Date(); // 現在日時を取得
        const formattedDate = formatDate(created_at); // フォーマットされた日付

        const connection = await pool.getConnection();
        const [result] = await connection.execute(
            'INSERT INTO thread (title, created_at) VALUES (?, ?)',
            [title, formattedDate]
        );
        connection.release();

        res.json({ 
            success: true, 
            id: result.insertId,
            title: title,
            date: formattedDate // フォーマットされた日付を返す
        });
    } catch (error) {
        console.error('Error creating topic:', error);
        res.status(500).json({ success: false, message: 'トピックの作成に失敗しました' });
    }
});

app.get('/topics', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM thread ORDER BY created_at DESC');
        connection.release();

        // フォーマットされた日付をレスポンスとして返す
        const formattedRows = rows.map(row => {
            return {
                ...row,
                created_at: formatDate(new Date(row.created_at)) // 作成日をフォーマット
            };
        });

        res.json(formattedRows);
    } catch (error) {
        console.error('Error fetching topics:', error);
        res.status(500).json({ message: 'トピックの取得に失敗しました' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

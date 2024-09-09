require('dotenv').config(); // 追加

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

app.delete('/delete-topic/:id', async (req, res) => {
    try {
        const topicId = req.params.id;
        const connection = await pool.getConnection();
        const [result] = await connection.execute('DELETE FROM thread WHERE id = ?', [topicId]);
        connection.release();

        if (result.affectedRows > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: 'トピックが見つかりません' });
        }
    } catch (error) {
        console.error('Error deleting topic:', error);
        res.status(500).json({ success: false, message: 'トピックの削除に失敗しました' });
    }
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/judge', async (req, res) => {
    try {
        const { chatHistory, topic } = req.body;
        const prompt = `
            次の議論を分析し、客観的に勝者を判断してください。議論のテーマは「${topic}」です。
            プレイヤーAとプレイヤーBの主張を評価し、より説得力のある議論を展開した方を勝者としてください。
            引き分けの場合は「引き分け」と判断してください。
            チャット履歴:
            ${chatHistory.map(msg => `プレイヤー${msg.player}: ${msg.message}`).join('\n')}

            判断結果を以下の形式で返し、勝者を述べた後は改行を挟んでください：
            勝者: [プレイヤーA or プレイヤーB or 引き分け] 
            理由: [簡潔な説明]
        `;

        const result = await model.generateContent(prompt);

        // `text` 関数を呼び出して結果を取得
        const judgement = await result.response.text();

        res.json({ result: judgement });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: '内部サーバーエラーが発生しました' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

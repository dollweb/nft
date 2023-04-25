var express = require('express');
var app = express();
var mongoose = require('mongoose');
var url = 'mongodb://localhost/BoardsDB';
var str = "";
mongoose
  .connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Successfully connected to mongodb'))
  .catch(e => console.error(e));
const connection = mongoose.connection
connection.on('error', console.error)
connection.once('open', () => {
  console.log('Connected to mongod server')
})
const board_schema = new mongoose.Schema({
        id: {type: Number, default: 0},
     title: { type: String },
     url: { type: String },
     imageUrl: { type: String },
     content: { type: String },
     likeCount: { type: Number, default: 0 },
     createdAt: { type: Date, default: Date.now },
     comments: { type : Array , "default" : [] }
},{
     versionKey: false
})
var bid = 0
const nfts = mongoose.model('nfts', board_schema);
nfts.findOne({},{},{sort:{'_id':-1}})
  .then(function(post){
        console.log(post.id);
        bid = post.id
  }).catch(function(post){
        console.log("board is empty");
        bid = 0
});
app.use(express.static('public'))
app.use(express.urlencoded({extended: false}))
const ejs = require('ejs');
app.set('view engine', 'ejs');
app.set('views', './views');
app.get('/',function(req, res) {
        res.send("Hi");
});
app.get('/data', (req, res) => {
  nfts.find().then((board) => {
    res.json(board)
  })
})
app.get('/lists', (req, res) => {
  nfts.find().then((boards) => {
    res.render("nftlists", {"name":"NFT Lists", "boards":boards})
  })
})
app.get('/edit', (req, res) => {
  if ( req.query.bid ) {
          bid = parseInt(req.query.bid)
     nfts.findOne({id:bid}).then((board) => {
       res.render("nftedit", {"name":"NFT Content", "board":board})
     })
  }
})
app.post('/edit', (req, res) => {
        console.log("edit post" + req.body.title + req.body.content)
  if ( req.query.bid ) {
          bid = parseInt(req.query.bid)
          console.log("bid" + bid)
          nfts.findOneAndUpdate({id:bid},{$set:{title:req.body.title,url:req.body.url,imageUrl:req.body.imageUrl,content:req.body.content}},null).then((board) => {
          //res.render("content", {"name":"Board Content", "board":board})
          res.redirect("/content?bid="+bid)
     })
  }
})
app.post('/comment', (req, res) => {
        console.log("comment post" + req.query.bid + req.body.comment)
  if ( req.query.bid ) {
          bid = parseInt(req.query.bid)
          console.log("bid" + bid + " cid=" + req.query.cid)
          nfts.findOneAndUpdate({id:bid},{$push:{comments:req.body.comment}},{new:true}).then((board) => {
          //res.render("content", {"name":"Board Content", "board":board})
          res.redirect("/content?bid="+bid)
     })
  }
})
app.get('/delcomm', (req, res) => {
        console.log("delete comment " + req.query.bid + req.query.cid)
  if ( req.query.bid ) {
          bid = parseInt(req.query.bid)
          console.log("bid" + bid + " cid=" + req.query.cid)
          nfts.findOneAndUpdate({id:bid},{$pull:{comments:req.query.cid}},{new:true}).then((board) => {
          //res.render("content", {"name":"Board Content", "board":board})
          res.redirect("/content?bid="+bid)
     })
  }
})
app.get('/like', (req, res) => {
        console.log("like add")
  if ( req.query.bid ) {
          bid = parseInt(req.query.bid)
          console.log("bid" + bid)
          nfts.findOneAndUpdate({id:bid},{$inc:{likeCount:1}},{new:true})
             .then( function(board) {
                console.log(" like update success. bid" + bid + board)
                res.render("nftcontent", {"name":"NFT Content", "board":board})
             })
  }
})
app.get('/content', (req, res) => {
        console.log(req.query)
  if ( req.query.bid ) {
          bid = parseInt(req.query.bid)
        console.log(bid)
     nfts.findOne({id:bid}).then((board) => {
             console.log("content read good");
       res.render("nftcontent", {"name":"NFT Content", "board":board})
     })
  }
})
app.post('/board', (req, res) => {
   const title = req.body.title
   const content = req.body.content
   const url = req.body.url
   const imageUrl = req.body.imageUrl
   const boards = new nfts({
         id : ++bid,
         title: title,
         url: url,
         imageUrl: imageUrl,
         content: content,
   })
   boards.save()
                .then(()=>res.redirect("/lists"))
                .catch((err)=>res.json(req.body))
})
var server = app.listen(8080, function() {});
==========================================
public/nft.html
==========================================
<H2> Add NFT List</H2>
<form method=post action=/board>
        <label>제목</label>
        <input type=text name=title size=100><br>
        <label>NFT 주소</label>
        <input type=text name=url size=160><br>
        <label>그림주소</label>
        <input type=text name=imageUrl size=100><br>
        <label>내용</label><br>
        <textarea name=content rows="5" cols="100"></textarea><br>
        <input type=submit>
</form>
==========================================
views/nftlists.ejs
==========================================
<html>
<head>
<style>
tr,th,td { padding : 5px }
</style>
</head>
<body>
    <h1><%=name%></h1>
    <table border=1  style="border-collapse:collapse">
    <tr><th>id</th><th>Title</th>
        <th>Image</th><th>Site</th>
        <th>Content</th><th>likeCount</th></tr>
    <% boards.forEach(function(list){ %>
        <tr><td><%=list.id%></td><td><a href="/content?bid=<%=list.id%>"><%=list.title%></a></td>
            </td><td><img width=100 src="<%=list.imageUrl%>"></td>
            </td><td><a href="<%=list.url%>"><%=list.imageUrl.split('/')[2]%></a></td>
            <td><%=list.content%></td>
            <td><%=list.likeCount%></td></tr>
    <% }) %>
    </table>
    <a href="nft.html">NFT 추가</a>
</body>
</html>
==========================================
views/nftcontent.ejs
==========================================
<html>
<head>
<style>
th,td { padding : 5px }
</style>
</head>
<body>
    <h1><%=name%></h1>
    <table border=1 style="border-collapse:collapse">
    <tr><th>id</th><th>Title</th><th>Site</th><th>image</th><th>Content</th><th>like</th></tr>
        <tr><td><%=board.id%></td></td><td><%=board.title%></td>
        <td><a href="<%=board.url%>"><%=board.imageUrl.split('/')[2]%></a></td>
        <td><img width=100 src="<%=board.imageUrl%>"></td>
        <td><%=board.content%></td>
        <td><%=board.likeCount%></td></tr>
        <tr><td colspan=6>댓글</td></tr>
    <% board.comments.forEach(function(comment,id){ %>
        <tr><td><%=id%></td><td colspan=4><%=comment%></td>
            <td><a href="/delcomm?bid=<%=board.id%>&cid=<%=comment%>">삭제</a></td></tr>
    <% }) %>
    </table>
    <a href="/like?bid=<%=board.id%>">좋아요~</a> |
    <a href="/edit?bid=<%=board.id%>">수정</a> |
    <a href="/lists">목록 전체보기</a>
    <form method=post action="/comment?bid=<%=board.id%>&cid=<%=board.comments.length%>"><input type=text name=comment size=50><input type=submit value="댓글쓰기"></form>
</body>
</html>
==========================================
views/nftedit.html
==========================================
<body>
    <h1><%=name%></h1>
    <form method=post action='/edit?bid=<%=board.id%>'>
    <table>
    <tr><td>id</td><td><%=board.id%></td></tr>
    <tr><td>title</td><td><input type="text" name=title value="<%=board.title%>" size=100></td></tr>
    <tr><td>url</td><td><input type="text" name=url value="<%=board.url%>" size=160></td></tr>
    <tr><td>image url</td><td><input type="text" name=imageUrl value="<%=board.imageUrl%>" size=100></td></tr>
    <tr><td>content</td><td><textarea name=content cols=100><%=board.content%></textarea><br></td></tr>
    <tr><td><input type="submit" value=수정></td><td></td></tr>
    </table>
    </form>
</body>

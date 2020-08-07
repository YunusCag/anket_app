const router=require('express').Router();
const authMiddleware=require('../middleware/authMiddleware');
const postController=require('../controllers/postController');
const imageUploadMware=require('../middleware/imageUploadMiddleware');
router
.route('/')
.get(authMiddleware,postController.getPosts)
.post([authMiddleware,imageUploadMware.upload.single('postImage'),imageUploadMware.resizeImage],postController.addPost);

router
.route('/ratePost/:id')
.post(authMiddleware,postController.ratePost);

router
.route('/likePost/:id')
.post(authMiddleware,postController.likePost);

router
.route('/unlikePost/:id')
.post(authMiddleware,postController.unLikePost);

module.exports=router;
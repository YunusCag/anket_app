const router=require('express').Router();
const authMiddleware=require('../middleware/authMiddleware');
const userController=require('../controllers/userController');
const imageUploadMware=require('../middleware/imageUploadMiddleware');
router
.route('/')
.post(authMiddleware,userController.findUser);

router.post('/setProfileImage',
[authMiddleware,imageUploadMware.upload.single('profileImage'),imageUploadMware.resizeImage],userController.addProfileImage);

router.post('/addUser',userController.addUser);
router.post('/login',userController.loginAccount);
router.get('/current',authMiddleware,userController.currentAccount);
router.post('/addFriend/:id',authMiddleware,userController.addFriend);
router.post('/deleteFriend/:id',authMiddleware,userController.deleteFriend);


module.exports = router;
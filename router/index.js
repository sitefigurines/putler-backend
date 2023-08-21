const Router = require("express").Router;
const userController = require("../controllers/user-controller");
const paymentController = require("../controllers/payment-controller");
const cartController = require("../controllers/cart-controller");
const fortuneController = require("../controllers/fortune-controller");
const certificateControler = require("../controllers/certificate-controller");
const router = new Router();
const { body } = require("express-validator");
const authMiddleware = require("../middlewares/auth-middleware");
const renderController = require("../controllers/render-controller");

router.post(
  "/registration",
  body("email").isEmail(),
  body("password").isLength({ min: 3, max: 32 }),
  userController.registration
);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.get("/activate/:link", userController.activate);
router.post("/refresh", userController.refresh);
router.get("/getUser", authMiddleware, userController.getUser);
router.get("/users", authMiddleware, userController.getUsers);
router.get("/user/money", authMiddleware, userController.getUsersMoney);
router.post("/user/topupmoney", authMiddleware, userController.topUpUsersMoney);
router.post(
  "/user/buywithbonuses",
  authMiddleware,
  userController.buyWithBonuses
);
router.post("/payment/callback", paymentController.saveCallback);
router.post("/payment/status", paymentController.paymentStatus);
router.post(
  "/payment/addOrderQueue",
  authMiddleware,
  paymentController.addOrderQueue
);

router.post("/pay", paymentController.createForm);
router.post("/user/addtocart", authMiddleware, cartController.addToCart);
router.post(
  "/user/removefromcart",
  authMiddleware,
  cartController.removeFromCart
);
router.post("/user/getiteminfo", cartController.getGoodsInfo);
router.get("/user/usercart", authMiddleware, cartController.getCart);
router.post("/user/moreamount", authMiddleware, cartController.moreAmount);
router.post("/user/lessamount", authMiddleware, cartController.lessAmount);
router.get("/user/checkSum", authMiddleware, cartController.countCost);
router.get("/user/checkHalfSum", authMiddleware, cartController.countHalfCost);
router.post("/user/wheel-of-fortune", authMiddleware, fortuneController.play);
router.get("/getorderid", authMiddleware, cartController.getOrderId);

// sertificats
router.post(
  "/certificate/register",
  authMiddleware,
  certificateControler.registerCertificate
);
router.post(
  "/certificate/use",
  authMiddleware,
  certificateControler.useCertificate
);

// keep render onlone
router.get("/keep-server-online", renderController.keepServerOnline);

module.exports = router;

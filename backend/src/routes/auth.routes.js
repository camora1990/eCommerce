import { request, response, Router } from "express";
import {
  authResponse,
  errorResponse,
  logoutResponse,
} from "../helpers/responses.helper.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { validateExtensionImages } from "../middlewares/validations.middleware.js";
import { AuthService } from "../services/auth.service.js";

export class AuhtRoute {
  #router;
  #services;
  constructor() {
    this.#router = Router();
    this.#services = new AuthService();
    this.#routes();
  }

  #routes() {
    this.#router.post("/login", async (req = request, res = response) => {
      const response = await this.#services.login(req.body);
      response.success
        ? authResponse(res, 200, true, "Successful login", response.user)
        : errorResponse(res, response.error, response.status);
    });

    this.#router.post(
      "/signup",
      validateExtensionImages,
      async (req = request, res = response) => {
        const { files } = req;
        const response = await this.#services.signup(req.body, files);
        response.success
          ? authResponse(
              res,
              201,
              true,
              "The user has been created",
              response.user
            )
          : errorResponse(res, response.error);
      }
    );

    this.#router.get(
      "/session",
      verifyToken,
      (req = request, res = response) => {
        const {iat,exp, ...payload } = req.payload;

        return res
          .status(200)
          .json({
            ok: true,
            message: "Successful session recovery",
            ...payload,
          });
      }
    );

    this.#router.post("/logout", async (req = request, res = response) => {
      logoutResponse(res);
    });
  }

  get router() {
    return this.#router;
  }
}

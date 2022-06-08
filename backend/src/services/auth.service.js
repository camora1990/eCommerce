import { validatePassword } from "../helpers/bcrypt.helper.js";
import { createJWT } from "../helpers/jwt.helper.js";
import UserService from "./user.service.js";
import { v4 as uuid } from "uuid";
import sendEmail from "../libs/emails.js";
import { jwtSecret, apiVersion, callbackUrl } from "../config/config.js";
import Jwt from "jsonwebtoken";

export class AuthService {
  #userService;
  constructor() {
    this.#userService = new UserService();
  }

  async signup(user, files = null) {
    const { name, email, password, image, role } = user;
    const response = await this.#userService.postUser(
      {
        name,
        email,
        password,
        image,
        role,
        provider: {
          local: true,
        },
      },
      files
    );
    if (response.success) {
      try {
        const data = await createJWT(response.user);
        response.user = data;

        const tokenForEmail = await Jwt.sign(
          {
            email: response.user.email,
            id: response.user._id,
            role: response.user.role,
          },
          jwtSecret,
          { expiresIn: "1h" }
        );

        await sendEmail(
          data.payload.email,
          "Confirma tu email",
          "Bienvenido a la aplicación",
          `<h1>Hola ${name}, bienvenid@ a ecommerce.com,</h1> 
          <p>Para confirmar tu dirección de correo haz click en el siguiente enlace:</p>
          <p><a href=${callbackUrl}/api/${apiVersion}/email_validation/${tokenForEmail}>Confirmar email</a></p>`
        )

        return response;
      } catch (error) {
        return { success: false, error };
      }
    }
    return response;
  }


  async login(data) {
    const { email, password } = data;
    try {
      const response = await this.#userService.getUserByEmail(email);
      if (!response.success) return response;

      const message = "Incorrect user or password";

      const isvalidPassord = await validatePassword(
        password,
        response.user?.password || null
      );

      if (!isvalidPassord || !response.user)
        return { success: false, status: 401, error: { message } };

      const data = await createJWT(response.user);
      response.user = data;
      return response;
    } catch (error) {
      return { success: false, status: 500, error };
    }
  }

  async socialLogin(profile) {
    const user = {
      name: profile.displayName,
      email: profile.emails[0].value,
      image: profile.photos[0].value,
      password: uuid(),
      provider: {
        [profile.provider]: true,
      },
      idProvider: {
        [profile.provider]: profile.id,
      },
    };
    try {
      const response = await this.#userService.socialLogin(
        user,
        profile.provider,
        profile.id
      );
      if (!response.success) return response;

      const data = await createJWT(response.user);
      response.user = data;
      return response;
    } catch (error) {
      return { success: false, error };
    }
  }
}

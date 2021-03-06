import React, { Component } from 'react';
import jwt from 'jsonwebtoken';
import nextCookies from 'next-cookies';
import cookies from 'js-cookie';
import fetch from '../lib/fetch';
import Error from '../components/Error';

export default (
  Page,
  { loginRequired = false, logoutRequired = false, adminRequired = false } = {},
) =>
  class Wrapper extends Component {
    static getInitialProps = async (ctx) => {
      // Récupère le cookie de connexion
      const { auth } = nextCookies(ctx);
      let user = null;

      // Si un cookie est existant
      if (auth) {
        // Vérifie et décode le cookie
        const decoded = jwt.verify(auth, process.env.TOKEN_SECRET);

        // Si le cookie décodé contient l'id de l'utilisateur
        if (decoded && decoded._id) {
          try {
            // Récupère les informations de l'utilisateur
            const response = await fetch('get', `/api/users/${decoded._id}`);
            // Assigne les données utilisateur
            user = response.data.user;
          } catch (error) {
            // En cas d'erreur, le cookie est supprimé
            cookies.remove('auth');
          }
        }
      }

      if (Page.getInitialProps) {
        return { user, ...((await Page.getInitialProps(ctx)) || {}) };
      }

      return { user };
    };

    render() {
      const { user } = this.props;

      // Si aucun utilisateur n'est connecté ou qu'il n'est pas admin
      if ((adminRequired && !user) || (adminRequired && user && !user.isAdmin)) {
        return <Error />;
      }

      // Si aucun utilisateur n'est connecté
      if (loginRequired && !logoutRequired && !user) {
        return <Error />;
      }

      // Si un utilisateur est connecté
      if (logoutRequired && user) {
        return <Error />;
      }

      return <Page {...this.props} />;
    }
  };

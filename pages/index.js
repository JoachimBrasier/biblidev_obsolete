import React, { useState } from 'react';
import { Layout, Row, Col, Spin, Result, Tag, Skeleton } from 'antd';
import { LoadingOutlined, FrownOutlined } from '@ant-design/icons';
import useSWR from 'swr';
import LazyLoad from 'react-lazyload';
import withAuth from '../middlewares/withAuth';
import fetch from '../lib/fetch';
import Hero from '../components/pages/home/Hero';
import SearchBar from '../components/pages/home/SearchBar';
import Sidebar from '../components/pages/home/Sidebar';
import ResourceCard from '../components/pages/home/ResourceCard';

const { Content } = Layout;

const Home = ({ user, categories }) => {
  const [filters, setFilters] = useState({
    categories: [],
    mode: 'in',
    sortBy: 'newest',
    search: '',
  });

  // Génère les paramètres d'URL
  const resourcesURLParams = () => {
    const entries = Object.entries(filters);
    const url = [];

    for (const [key, value] of entries) {
      if (Array.isArray(value)) {
        url.push(`${key}=${value.join(';')}`);
      } else {
        url.push(`${key}=${value}`);
      }
    }

    return url.join('&');
  };

  // Récupère les ressources
  const resourcesRequest = useSWR(
    `/api/resources?${resourcesURLParams()}`,
    (url) => fetch('get', url),
    {
      refreshInterval: 60000, // Recharge les catégories toutes les minutes
    },
  );

  // Change le mode de tri des catégories
  const setMode = ({ key }) => {
    return setFilters((previous) => ({
      ...previous,
      mode: key,
    }));
  };

  const setSort = (value) => {
    return setFilters((previous) => ({
      ...previous,
      sortBy: value,
    }));
  };

  // Ajout ou retire la catégorie séléctionnée des filtres
  const setCategories = (categoryId) => {
    const updatedCategories = filters.categories;

    // Si la catégorie est déjà séléctionnée
    if (filters.categories.includes(categoryId)) {
      // Récupère la position de la catégorie dans le tableau
      const index = filters.categories.indexOf(categoryId);
      // Retire la catégorie du tableau
      updatedCategories.splice(index, 1);

      return setFilters((previous) => ({
        ...previous,
        categories: updatedCategories,
      }));
    }

    // Ajoute la catégorie dans le tableau
    updatedCategories.push(categoryId);

    return setFilters((previous) => ({
      ...previous,
      categories: updatedCategories,
    }));
  };

  // Retire toutes les catégories séléctionnées
  const resetCategories = () => {
    return setFilters((previous) => ({
      ...previous,
      categories: [],
    }));
  };

  // Modifie la recherche
  const setSearch = (value) => {
    return setFilters((previous) => ({
      ...previous,
      search: value,
    }));
  };

  // Composant des ressources
  const Resources = () => {
    // Destructure la requête
    const { data } = resourcesRequest;

    // Si la requête n'est pas terminé
    if (!data) {
      return (
        <Row style={{ margin: '20px 0' }} type="flex" justify="center">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        </Row>
      );
    }

    // Si une erreur est survenue ou que le résultat de la requête est vide
    if (data.status === 'error' || !data.data.resources) {
      return <Result status="error" title="Une erreur est survenue, veuillez réessayez" />;
    }

    // Si il y a aucune ressource
    if (data.data.resources.length === 0) {
      return <Result icon={<FrownOutlined />} title="Aucune ressource n'a été trouvée" />;
    }

    // Affiche les ressources
    return (
      <Row gutter={[12, 12]}>
        {data.data.resources.map((resource) => (
          <Col xs={24} sm={12} md={8} lg={8} xl={6} xxl={4} key={resource._id}>
            <LazyLoad
              height="100%"
              once
              unmountIfInvisible
              placeholder={<Skeleton avatar active title paragraph />}
            >
              <ResourceCard
                record={resource}
                selectedCategories={filters.categories}
                onCategoriesChange={setCategories}
                searchQuery={filters.search}
                user={user}
              />
            </LazyLoad>
          </Col>
        ))}
      </Row>
    );
  };

  // Affiche le nombre de catégories séléctionnées
  const SelectedCategories = () => {
    // Si le tableau n'existe pas ou si il est vide
    if (!filters.categories || filters.categories.length === 0) {
      return null;
    }

    // Si il y a qu'une catégorie séléctionnée
    if (filters.categories.length === 1) {
      return (
        <Row style={{ marginBottom: 10 }}>
          <Tag closable onClose={resetCategories}>
            1 catégorie séléctionnée
          </Tag>
        </Row>
      );
    }

    // Si il y a plusieurs catégories séléctionées
    return (
      <Row style={{ marginBottom: 10 }}>
        <Tag closable onClose={resetCategories}>
          {/* eslint-disable-next-line */}
          {filters.categories.length} catégories séléctionnées
        </Tag>
      </Row>
    );
  };

  return (
    <div className="home-wrapper">
      <Layout>
        <Sidebar
          categories={categories}
          selectedCategories={filters.categories}
          onCategoriesChange={setCategories}
          selectedMode={filters.mode}
          onModeChange={setMode}
        />
        <Content className="home-content">
          <Hero />
          <SearchBar selectedOption={filters.sortBy} onSearch={setSearch} onSortChange={setSort} />
          <SelectedCategories />
          <Resources />
        </Content>
      </Layout>
    </div>
  );
};

Home.getInitialProps = async () => {
  // Récupère les catégories
  const { data } = await fetch('get', '/api/categories');

  return { categories: data.categories };
};

export default withAuth(Home);

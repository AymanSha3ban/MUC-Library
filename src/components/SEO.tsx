import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    keywords?: string;
    image?: string;
    type?: string;
}

const SEO: React.FC<SEOProps> = ({
    title,
    description,
    keywords,
    image = '/web-icon.png',
    type = 'website'
}) => {
    const siteTitle = 'MUC Library';
    const fullTitle = title === siteTitle ? title : `${title} | ${siteTitle}`;

    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{fullTitle}</title>
            {description && <meta name='description' content={description} />}
            {keywords && <meta name='keywords' content={keywords} />}

            {/* Facebook tags */}
            <meta property='og:type' content={type} />
            <meta property='og:title' content={fullTitle} />
            {description && <meta property='og:description' content={description} />}
            <meta property='og:image' content={image} />

            {/* Twitter tags */}
            <meta name='twitter:card' content='summary_large_image' />
            <meta name='twitter:title' content={fullTitle} />
            {description && <meta name='twitter:description' content={description} />}
            <meta name='twitter:image' content={image} />
        </Helmet>
    );
};

export default SEO;

/** @format */
/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { flowRight } from 'lodash';
import { localize } from 'i18n-calypso';
/**
 * Internal dependencies
 */
import Card from 'components/card';
import DocumentHead from 'components/data/document-head';
import FormattedHeader from 'components/formatted-header';
import { getSelectedSite } from 'state/ui/selectors';
import Main from 'components/main';
import SkipSurvey from './skip-survey';
import Placeholder from 'my-sites/site-settings/placeholder';
import redirectNonJetpackToGeneral from 'my-sites/site-settings/redirect-to-general';

class DisconnectSite extends Component {
	render() {
		const { site, translate } = this.props;

		if ( ! site ) {
			return <Placeholder />;
		}
		return (
			<Main className="disconnect-site site-settings">
				<DocumentHead title={ translate( 'Site Settings' ) } />
				<FormattedHeader
					headerText={ translate( 'Disconnect Site' ) }
					subHeaderText={ translate(
						'Tell us why you want to disconnect your site from Wordpress.com.'
					) }
				/>
				<Card className="disconnect-site__card"> </Card>
				<SkipSurvey />
			</Main>
		);
	}
}

const connectComponent = connect( state => {
	{
		site: getSelectedSite( state );
	}
} );

export default flowRight( connectComponent, localize, redirectNonJetpackToGeneral )(
	DisconnectSite
);

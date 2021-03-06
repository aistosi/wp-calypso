/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { Steps } from './constants';
import DocumentHead from 'components/data/document-head';
import Intro from './intro';
import Main from 'components/main';
import Wizard from 'components/wizard';
import { getSelectedSiteSlug } from 'state/ui/selectors';

const SetupWizard = ( {
	slug,
	stepName = Steps.INTRO,
	translate,
} ) => {
	const steps = [ Steps.INTRO ];
	const components = {
		[ Steps.INTRO ]: <Intro />,
	};
	const mainClassName = 'wp-job-manager__setup';

	return (
		<Main className={ mainClassName }>
			<DocumentHead title={ translate( 'Setup' ) } />
			<Wizard
				basePath={ `/extensions/wp-job-manager/setup/${ slug }` }
				components={ components }
				forwardText={ translate( 'Continue' ) }
				steps={ steps }
				stepName={ stepName } />
		</Main>
	);
};

const mapStateToProps = state => ( {
	slug: getSelectedSiteSlug( state ),
} );

SetupWizard.propTypes = {
	slug: PropTypes.string,
	stepName: PropTypes.string,
	translate: PropTypes.func.isRequired,
};

export default connect( mapStateToProps )( localize( SetupWizard ) );

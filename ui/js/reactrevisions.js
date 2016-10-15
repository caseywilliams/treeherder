'use strict';

// via pushlogRevisionsClone.html
var PushlogRevisionComponent = React.createClass({
    displayName: 'PushlogRevisionComponent',
    propTypes: {
        href: React.PropTypes.string.isRequired
    },
    render: function() {
        return React.DOM.li(
            {},
            React.DOM.a({
                    href: this.props.href,
                    'ignore-job-clear-on-click': true,
                    target: '_blank'
                },
                '...and more'
            ),
            React.DOM.i({ className: 'fa fa-external-link-square' })
        )
    }
});
var PushlogRevisionComponentFactory = React.createFactory(PushlogRevisionComponent);

// via revisionsClone.html
var RevisionItemComponent = React.createClass({
    displayName: 'RevisionItemComponent',
    propTypes: {
        revision: React.PropTypes.object.isRequired,
        repo: React.PropTypes.object.isRequired
    },
    componentWillMount: function() {
        var injector = angular.element(document.body).injector();
        this.initialsFilter = injector.get('$filter')('initials');
        this.linkifyBugsFilter = injector.get('linkifyBugsFilter');
    },
    render: function() {
        var email, name, userTokens, escapedComment, escapedCommentHTML, initialsHTML, tags;

        userTokens = this.props.revision.author.split(/[<>]+/);
        name = userTokens[0];
        if (userTokens.length > 1) email = userTokens[1];
        initialsHTML = {
            __html: this.initialsFilter(name)
        };

        escapedComment = _.escape(this.props.revision.comments.split('\n')[0]);
        escapedCommentHTML = {
            __html: this.linkifyBugsFilter(escapedComment)
        };

        tags = "";
        if(escapedComment.search("Backed out") >= 0 ||
           escapedComment.search("Back out") >= 0) {
            tags += "backout ";
        }
        tags = tags.trim();

        return React.DOM.li(
            { className: 'clearfix' },
            React.DOM.span({
                    className: 'revision',
                    'data-tags': tags
                },
                React.DOM.span(
                    { className: 'revision-holder' },
                    React.DOM.a({
                            title: `Open revision ${this.props.revision.revision} on ${this.props.repo.url}`,
                            href: this.props.repo.getRevisionHref(this.props.revision.revision),
                            'ignore-job-clear-on-click': true
                        },
                        this.props.revision.revision.substring(0, 12)
                    )
                ),
                React.DOM.span({
                    title: `${name}: ${email}`,
                    dangerouslySetInnerHTML: initialsHTML
                }),
                React.DOM.span(
                    { title: escapedComment },
                    React.DOM.span(
                        { className: 'revision-comment' },
                        React.DOM.em({ dangerouslySetInnerHTML: escapedCommentHTML })
                    )
                )
            )
        )
    }
});
var RevisionItemComponentFactory = React.createFactory(RevisionItemComponent);

var RevisionListComponent = React.createClass({
    displayName: 'RevisionListComponent',
    propTypes: {
        resultset: React.PropTypes.object.isRequired,
        repo: React.PropTypes.object.isRequired,
        aggregateid: React.PropTypes.string.isRequired
    },
    render: function() {
        var repo, pushlogEl;

        if (this.props.resultset.revision_count > this.props.resultset.revisions.length) {
            pushlogEl = PushlogRevisionComponentFactory(
                { href: this.props.repo.getPushLogHref(this.props.resultset.revision) }
            );
        } else pushlogEl = null;

        repo = this.props.repo;

        return React.DOM.div(
            { className: 'row result-set clearfix' },
            React.DOM.span(
                { className: 'revision-list col-xs-5' },
                React.DOM.ul(
                    { className: 'list-unstyled' },
                    this.props.resultset.revisions.map(function(item, i) {
                        return RevisionItemComponentFactory({
                            revision: item,
                            repo: repo,
                            key: i
                        })
                    }),
                    pushlogEl
                )
            ),
            React.DOM.span(
                { className: 'job-list col-xs-7 job-list-pad' },
                React.DOM.span({ className: 'fa fa-spinner fa-pulse th-spinner' }),
                React.DOM.table({
                    className: 'table-hover',
                    id: this.props.aggregateid
                })
            )

        )
    }
});

treeherder.directive('revisions', function (reactDirective) {
    return reactDirective(RevisionListComponent);
});

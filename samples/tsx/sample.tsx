/// <reference path='../../typings/index.d.ts' />
interface Nothing {}
class CommentBox extends React.Component<{ url: string, pollInterval: number}, CommentData> {
  constructor(){
    super()
    this.state = { data: [] };
  }
  fetchComments() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: (data) => this.setState({ data: data }),
      error: (xhr, status, err) => console.error(status, err)
    })
  }
  componentDidMount() {
    this.fetchComments();
    setInterval(this.fetchComments.bind(this), this.props.pollInterval);
  }
  render() {
    let handleCommentSubmit = (comment: { author: string, text: string }) => {
      console.warn('comment submitted!', comment);
      const updated = this.state.data.slice(0);
      updated.push(comment);
      this.setState({ data: updated });
    }
    return (
      <div className="commentBox">
        <h1>Comments</h1>
        <CommentList data={this.state.data}/>
        <CommentForm onCommentSubmit={handleCommentSubmit} />
      </div>
    );
  }
}

class CommentList extends React.Component<CommentData, Nothing> {
  render() {
    const nodes = this.props.data.map(comment => <Commentt author={comment.author}>{comment.text}</Commentt>)
    return (
      <div className="commentList">
        {nodes}
      </div>
    );
  }
};

class CommentForm extends React.Component<{ onCommentSubmit: (t: { author: string, text: string }) => void }, Nothing> {
  render() {
    let handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const author = (this.refs['author'] as any as HTMLInputElement).value.trim();
      const text = (this.refs['text'] as any as HTMLInputElement).value.trim();
      if (author.length >0 && text.length > 0) {
        this.props.onCommentSubmit({ author: author, text: text });
      }
    }

    return (
      <form className="commentForm" onSubmit={handleSubmit}>
        <input type="text" placeholder="Your name" ref="author"/>
        <input type="text" placeholder="Say something..." ref="text" />
        <input type="submit" value="Post" />
      </form>
    );
  }
};

interface CommentProps {
  author: string;
  children?: string;
}

class Commentt extends React.Component<CommentProps, Nothing> {
  render() {
    return (
      <div className="comment">
        <h2 className="commentAuthor">
          {this.props.author}
        </h2>
        {this.props.children}
      </div>
    );
  }
}
interface CommentDataItem {
  author: string;
  text: string;
}
interface CommentData {
  data: Array<CommentDataItem>;
}

ReactDOM.render(
  <CommentBox url="/public/js/comments.json" pollInterval={5000}/>,
  document.getElementById('content')
);

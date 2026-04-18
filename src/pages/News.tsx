import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { ar, fr } from 'date-fns/locale';
import {
  Heart, MessageCircle, Share2, Image as ImageIcon, Video, X, Send,
  Loader2, Trash2, MoreHorizontal, User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ORGANIZER_BASE } from '@/lib/constants';

interface Profile { user_id: string; display_name: string; avatar_url: string | null; }
interface Post {
  id: string;
  author_id: string;
  content: string;
  media_urls: string[];
  media_types: string[];
  created_at: string;
  author?: Profile;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  liked_by_me: boolean;
}
interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}

export default function News() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const dateLocale = i18n.language === 'fr' ? fr : ar;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const [openComments, setOpenComments] = useState<Record<string, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`${ORGANIZER_BASE}/auth?tab=login`);
      return;
    }
    if (user) loadPosts();
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel('news-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => loadPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_reactions' }, () => loadPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments' }, () => loadPosts())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const loadPosts = async () => {
    if (!user) return;
    setLoading(true);
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!postsData) { setPosts([]); setLoading(false); return; }

    const authorIds = [...new Set(postsData.map(p => p.author_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', authorIds);

    const postIds = postsData.map(p => p.id);
    const [{ data: reactions }, { data: comments }, { data: shares }] = await Promise.all([
      supabase.from('post_reactions').select('post_id, user_id, reaction').in('post_id', postIds),
      supabase.from('post_comments').select('post_id').in('post_id', postIds),
      supabase.from('post_shares').select('post_id').in('post_id', postIds),
    ]);

    const enriched: Post[] = postsData.map(p => {
      const postReactions = reactions?.filter(r => r.post_id === p.id) || [];
      const myReaction = postReactions.find(r => r.user_id === user.id);
      const counts: Record<string, number> = {};
      for (const r of postReactions) counts[r.reaction] = (counts[r.reaction] || 0) + 1;
      return {
        ...p,
        author: profiles?.find(pr => pr.user_id === p.author_id),
        likes_count: postReactions.length,
        comments_count: comments?.filter(c => c.post_id === p.id).length || 0,
        shares_count: shares?.filter(s => s.post_id === p.id).length || 0,
        liked_by_me: !!myReaction,
        my_reaction: myReaction?.reaction || null,
        reaction_counts: counts,
      } as any;
    });

    setPosts(enriched);
    setLoading(false);
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...list].slice(0, 4));
  };

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const handlePublish = async () => {
    if (!user || (!content.trim() && files.length === 0)) return;
    setPosting(true);
    try {
      const urls: string[] = [];
      const types: string[] = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('posts-media').upload(path, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('posts-media').getPublicUrl(path);
        urls.push(publicUrl);
        types.push(file.type.startsWith('video') ? 'video' : 'image');
      }

      const { error: insErr } = await supabase.from('posts').insert({
        author_id: user.id,
        content: content.trim(),
        media_urls: urls,
        media_types: types,
      });
      if (insErr) throw insErr;

      setContent('');
      setFiles([]);
      toast({ title: t('common.success'), description: t('news.publish') + ' ✅' });
    } catch (e: any) {
      toast({ title: t('common.error'), description: e.message, variant: 'destructive' });
    } finally {
      setPosting(false);
    }
  };

  const reactionTypes = [
    { type: 'like', emoji: '👍', label: t('news.reactions.like') },
    { type: 'love', emoji: '❤️', label: t('news.reactions.love') },
    { type: 'haha', emoji: '😂', label: t('news.reactions.haha') },
    { type: 'wow', emoji: '😮', label: t('news.reactions.wow') },
    { type: 'sad', emoji: '😢', label: t('news.reactions.sad') },
  ];

  const setReaction = async (post: Post, reaction: string) => {
    if (!user) return;
    // Remove any existing reaction first
    await supabase.from('post_reactions').delete().eq('post_id', post.id).eq('user_id', user.id);
    if (!post.liked_by_me || (post as any).my_reaction !== reaction) {
      await supabase.from('post_reactions').insert({ post_id: post.id, user_id: user.id, reaction });
    }
    loadPosts();
  };

  const toggleLike = async (post: Post) => {
    await setReaction(post, (post as any).my_reaction || 'like');
  };

  const toggleComments = async (postId: string) => {
    if (openComments[postId]) {
      setOpenComments(prev => { const n = { ...prev }; delete n[postId]; return n; });
      return;
    }
    const { data: cmts } = await supabase
      .from('post_comments').select('*').eq('post_id', postId).order('created_at');
    if (!cmts) return;
    const ids = [...new Set(cmts.map(c => c.author_id))];
    const { data: profs } = await supabase
      .from('profiles').select('user_id, display_name, avatar_url').in('user_id', ids);
    setOpenComments(prev => ({
      ...prev,
      [postId]: cmts.map(c => ({ ...c, author: profs?.find(p => p.user_id === c.author_id) })),
    }));
  };

  const submitComment = async (postId: string) => {
    if (!user) return;
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    await supabase.from('post_comments').insert({
      post_id: postId, author_id: user.id, content: text,
    });
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    // refresh
    const { data: cmts } = await supabase
      .from('post_comments').select('*').eq('post_id', postId).order('created_at');
    if (cmts) {
      const ids = [...new Set(cmts.map(c => c.author_id))];
      const { data: profs } = await supabase
        .from('profiles').select('user_id, display_name, avatar_url').in('user_id', ids);
      setOpenComments(prev => ({
        ...prev,
        [postId]: cmts.map(c => ({ ...c, author: profs?.find(p => p.user_id === c.author_id) })),
      }));
    }
    loadPosts();
  };

  const sharePost = async (post: Post) => {
    if (!user) return;
    const url = `${window.location.origin}${ORGANIZER_BASE}/news#post-${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: t('news.title'), text: post.content.slice(0, 100), url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: t('news.linkCopied') });
      }
      await supabase.from('post_shares').insert({ post_id: post.id, user_id: user.id }).select();
      loadPosts();
    } catch {}
  };

  const deletePost = async (post: Post) => {
    if (!user || post.author_id !== user.id) return;
    if (!window.confirm(t('news.deleteConfirm'))) return;
    await supabase.from('posts').delete().eq('id', post.id);
    loadPosts();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">{t('news.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('news.subtitle')}</p>
      </header>

      {/* Composer */}
      <Card className="mb-6">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-3">
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {profile?.display_name?.charAt(0) || <UserIcon className="w-4 h-4" />}
              </AvatarFallback>
            </Avatar>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('common.writePost')}
              rows={3}
              className="resize-none border-0 bg-secondary focus-visible:ring-1"
            />
          </div>

          {files.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {files.map((f, i) => (
                <div key={i} className="relative rounded-lg overflow-hidden bg-secondary aspect-video">
                  {f.type.startsWith('video') ? (
                    <video src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                  ) : (
                    <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" alt="" />
                  )}
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-1 end-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <Button
                size="sm" variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 text-muted-foreground"
              >
                <ImageIcon className="w-4 h-4 text-success" /> {t('common.addPhoto')}
              </Button>
              <input
                ref={fileInputRef} type="file" accept="image/*,video/*" multiple
                onChange={handleFiles} className="hidden"
              />
            </div>
            <Button
              onClick={handlePublish}
              disabled={posting || (!content.trim() && files.length === 0)}
              className="gradient-primary text-primary-foreground gap-2"
            >
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {posting ? t('news.publishing') : t('news.publish')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      {posts.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">{t('news.noPosts')}</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <Card key={post.id} id={`post-${post.id}`} className="animate-fade-in-up">
              <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={post.author?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {post.author?.display_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{post.author?.display_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: dateLocale })}
                      </p>
                    </div>
                  </div>
                  {post.author_id === user?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => deletePost(post)} className="text-destructive">
                          <Trash2 className="w-4 h-4 me-2" /> {t('news.deletePost')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Content */}
                {post.content && <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>}

                {/* Media */}
                {post.media_urls.length > 0 && (
                  <div className={`grid gap-1 rounded-lg overflow-hidden ${post.media_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {post.media_urls.map((url, i) => (
                      <div key={i} className="relative bg-secondary aspect-video">
                        {post.media_types[i] === 'video' ? (
                          <video src={url} controls className="w-full h-full object-cover" />
                        ) : (
                          <img src={url} className="w-full h-full object-cover" alt="" loading="lazy" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Stats */}
                {(post.likes_count > 0 || post.comments_count > 0 || post.shares_count > 0) && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                    <span>{post.likes_count > 0 && `❤️ ${post.likes_count}`}</span>
                    <span>
                      {post.comments_count > 0 && `${post.comments_count} ${t('news.comments')}`}
                      {post.shares_count > 0 && ` · ${post.shares_count} ${t('news.shares')}`}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-3 gap-1 pt-2 border-t border-border">
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => toggleLike(post)}
                    className={`gap-2 ${post.liked_by_me ? 'text-destructive' : ''}`}
                  >
                    <Heart className={`w-4 h-4 ${post.liked_by_me ? 'fill-current' : ''}`} />
                    {t('common.like')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleComments(post.id)} className="gap-2">
                    <MessageCircle className="w-4 h-4" />
                    {t('common.comment')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => sharePost(post)} className="gap-2">
                    <Share2 className="w-4 h-4" />
                    {t('common.share')}
                  </Button>
                </div>

                {/* Comments */}
                {openComments[post.id] && (
                  <div className="space-y-3 pt-3 border-t border-border">
                    {openComments[post.id].map(c => (
                      <div key={c.id} className="flex gap-2">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarImage src={c.author?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {c.author?.display_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-secondary rounded-2xl px-3 py-2">
                          <p className="font-semibold text-xs">{c.author?.display_name || '—'}</p>
                          <p className="text-sm">{c.content}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {profile?.display_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex gap-2">
                        <Input
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => setCommentInputs(p => ({ ...p, [post.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && submitComment(post.id)}
                          placeholder={t('common.writeComment')}
                          className="bg-secondary border-0 rounded-full"
                        />
                        <Button size="icon" onClick={() => submitComment(post.id)} className="rounded-full shrink-0 gradient-primary text-primary-foreground">
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

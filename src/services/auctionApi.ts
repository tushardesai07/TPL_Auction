import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Team, Player, Tournament } from '../types';

/**
 * Upload image to Supabase Storage and retrieve its public URL.
 * Sets proper content-type, upsert: true, and returns the public bucket URL.
 */
export async function uploadMedia(file: File, bucket: 'player-photos' | 'team-logos' | 'tournament-assets'): Promise<{ url?: string; error?: string }> {
  if (!isSupabaseConfigured) {
    const localUrl = URL.createObjectURL(file);
    return { url: localUrl };
  }

  try {
    const rawExt = file.name.split('.').pop() || 'jpg';
    const fileExt = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${fileName}`;

    const contentType = file.type || (fileExt === 'png' ? 'image/png' : fileExt === 'webp' ? 'image/webp' : 'image/jpeg');

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType
      });

    if (uploadError) {
      console.error(`Storage upload to ${bucket} failed:`, uploadError);
      return { error: uploadError.message };
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { url: data.publicUrl };
  } catch (err: any) {
    return { error: err.message || 'Image upload failed' };
  }
}

/**
 * List files uploaded to a Supabase bucket and return their public URLs.
 */
export async function apiListBucketFiles(bucket: 'player-photos' | 'team-logos' | 'tournament-assets'): Promise<string[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list('', { limit: 20, sortBy: { column: 'created_at', order: 'desc' } });

    if (error || !data) return [];
    return data
      .filter(item => item.name && !item.name.startsWith('.') && item.name.match(/\.(png|jpe?g|webp|gif|svg)$/i))
      .map(item => {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(item.name);
        return urlData.publicUrl;
      });
  } catch {
    return [];
  }
}

// ----------------- TEAMS API -----------------

export async function apiCreateTeam(team: Omit<Team, 'id' | 'created_at' | 'updated_at'>): Promise<{ data?: Team; error?: string }> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([{
          tournament_id: team.tournament_id,
          name: team.name,
          short_name: team.short_name,
          logo_url: team.logo_url,
          owner_name: team.owner_name,
          initial_purse: team.initial_purse,
          remaining_purse: team.remaining_purse,
          spent_amount: team.spent_amount || 0,
          max_squad_size: team.max_squad_size || 15
        }])
        .select()
        .single();

      if (error) return { error: error.message };
      return { data: data as Team };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  // Local fallback
  const mockTeam: Team = {
    ...team,
    id: `team-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  return { data: mockTeam };
}

export async function apiUpdateTeam(teamId: string, updates: Partial<Team>): Promise<{ error?: string }> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          name: updates.name,
          short_name: updates.short_name,
          logo_url: updates.logo_url,
          owner_name: updates.owner_name,
          initial_purse: updates.initial_purse,
          remaining_purse: updates.remaining_purse,
          max_squad_size: updates.max_squad_size,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId);

      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }
  return {};
}

export async function apiDeleteTeam(teamId: string): Promise<{ error?: string }> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }
  return {};
}

// ----------------- PLAYERS API -----------------

export async function apiCreatePlayer(player: Omit<Player, 'id' | 'created_at' | 'updated_at'>): Promise<{ data?: Player; error?: string }> {
  if (isSupabaseConfigured) {
    try {
      const isIcon = (player.role as string) === 'Icon Player' || (player.role as string) === 'Icon';
      const dbRole = isIcon ? 'All Rounder' : player.role;
      const basePayload: any = {
        tournament_id: player.tournament_id,
        name: player.name,
        photo_url: player.photo_url,
        age: player.age,
        village: player.village,
        role: player.role,
        batting_style: player.batting_style,
        bowling_style: player.bowling_style,
        base_price: player.base_price,
        status: player.status || 'available',
        order_index: player.order_index
      };

      let { data, error } = await supabase
        .from('players')
        .insert([basePayload])
        .select()
        .single();

      // If check constraint fails on role (e.g. database schema check only allows core roles), fallback to dbRole
      if (error && error.code === '23514' && dbRole !== player.role) {
        basePayload.role = dbRole;
        const retry = await supabase.from('players').insert([basePayload]).select().single();
        data = retry.data;
        error = retry.error;
      }

      if (error) return { error: error.message };
      return { data: { ...(data as Player), is_icon: isIcon } };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  const mockPlayer: Player = {
    ...player,
    is_icon: (player.role as string) === 'Icon Player' || Boolean(player.is_icon),
    id: `player-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  return { data: mockPlayer };
}

export async function apiBatchCreatePlayers(playersList: Omit<Player, 'id' | 'created_at' | 'updated_at'>[]): Promise<{ count: number; error?: string }> {
  if (isSupabaseConfigured) {
    try {
      const payload = playersList.map(p => {
        const isIcon = (p.role as string) === 'Icon Player' || (p.role as string) === 'Icon';
        const dbRole = isIcon ? 'All Rounder' : p.role;
        return {
          tournament_id: p.tournament_id,
          name: p.name,
          photo_url: p.photo_url,
          age: p.age,
          village: p.village,
          role: dbRole,
          batting_style: p.batting_style,
          bowling_style: p.bowling_style,
          base_price: p.base_price,
          status: p.status || 'available',
          order_index: p.order_index
        };
      });

      const { data, error } = await supabase
        .from('players')
        .insert(payload)
        .select();

      if (error) return { count: 0, error: error.message };
      return { count: data?.length || 0 };
    } catch (err: any) {
      return { count: 0, error: err.message };
    }
  }

  return { count: playersList.length };
}

export async function apiUpdatePlayer(playerId: string, updates: Partial<Player>): Promise<{ error?: string }> {
  if (isSupabaseConfigured) {
    try {
      const isIcon = (updates.role as string) === 'Icon Player' || (updates.role as string) === 'Icon';
      const dbRole = isIcon ? 'All Rounder' : updates.role;
      const updateData: any = {
        name: updates.name,
        photo_url: updates.photo_url,
        age: updates.age,
        village: updates.village,
        role: updates.role,
        batting_style: updates.batting_style,
        bowling_style: updates.bowling_style,
        base_price: updates.base_price,
        status: updates.status,
        order_index: updates.order_index,
        updated_at: new Date().toISOString()
      };

      let { error } = await supabase
        .from('players')
        .update(updateData)
        .eq('id', playerId);

      if (error && error.code === '23514' && dbRole !== updates.role) {
        updateData.role = dbRole;
        const retry = await supabase.from('players').update(updateData).eq('id', playerId);
        error = retry.error;
      }

      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }
  return {};
}

export async function apiDeletePlayer(playerId: string): Promise<{ error?: string }> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);

      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }
  return {};
}
